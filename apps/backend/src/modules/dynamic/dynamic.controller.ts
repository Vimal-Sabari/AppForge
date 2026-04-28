import { Request, Response, NextFunction } from 'express'
import { ConfigCache } from '../../core/ConfigCache'
import { SchemaBuilder } from '../../core/SchemaBuilder'
import { QueryBuilder } from '../../core/QueryBuilder'
import { prisma } from '../../core/prisma'
import { AppConfig } from 'shared-types'
import { Prisma } from '@prisma/client'
import { NotificationService } from '../notifications/notification.service'

interface DynamicRequest extends Request {
  appConfig?: AppConfig
  user?: { id: string; email: string }
}

export async function validateConfigAndTable(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const dynamicReq = req as DynamicRequest
  const { appId, tableName } = dynamicReq.params

  try {
    const config = await ConfigCache.getConfig(appId)
    if (!config) {
      res.status(404).json({ error: 'App configuration not found', code: 'APP_NOT_FOUND' })
      return
    }

    const tableConfig = config.database.tables.find((t) => t.name === tableName)
    if (!tableConfig) {
      res.status(404).json({
        error: `Table '${tableName}' not found in app configuration`,
        code: 'TABLE_NOT_FOUND',
      })
      return
    }

    // Check user scoped access
    if (config.auth.userScoped && !dynamicReq.user?.id) {
      res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' })
      return
    }

    dynamicReq.appConfig = config
    next()
  } catch (error) {
    next(error)
  }
}

export async function listRecords(req: Request, res: Response, next: NextFunction): Promise<void> {
  const dynamicReq = req as DynamicRequest
  try {
    const { appId, tableName } = dynamicReq.params
    const { page, limit, sortBy, sortDir, ...filters } = dynamicReq.query

    const queryOptions = QueryBuilder.buildListQuery(appId, tableName, {
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 20,
      sortBy: sortBy as string,
      sortDir: sortDir as 'asc' | 'desc',
      filters: filters as Record<string, string>,
    })

    if (dynamicReq.appConfig?.auth.userScoped && dynamicReq.user?.id) {
      queryOptions.where = {
        ...queryOptions.where,
        createdBy: dynamicReq.user.id,
      }
    }

    const [data, total] = await Promise.all([
      prisma.appData.findMany(queryOptions),
      prisma.appData.count({ where: queryOptions.where }),
    ])

    // Map output to look like standard rows
    const formattedData = data.map((d) => ({
      id: d.id,
      ...(d.rowData as Record<string, unknown>),
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    }))

    res.json({
      data: formattedData,
      meta: {
        total,
        page: (queryOptions.skip || 0) / (queryOptions.take || 1) + 1,
        limit: queryOptions.take,
      },
    })
  } catch (error) {
    next(error)
  }
}

export async function getRecord(req: Request, res: Response, next: NextFunction): Promise<void> {
  const dynamicReq = req as DynamicRequest
  try {
    const { appId, tableName, id } = dynamicReq.params

    const whereClause: Prisma.AppDataWhereInput = { id, appId, tableName }
    if (dynamicReq.appConfig?.auth.userScoped && dynamicReq.user?.id) {
      whereClause.createdBy = dynamicReq.user.id
    }

    const record = await prisma.appData.findFirst({
      where: whereClause,
    })

    if (!record) {
      res.status(404).json({ error: 'Record not found', code: 'NOT_FOUND' })
      return
    }

    res.json({
      data: {
        id: record.id,
        ...(record.rowData as Record<string, unknown>),
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
    })
  } catch (error) {
    next(error)
  }
}

export async function createRecord(req: Request, res: Response, next: NextFunction): Promise<void> {
  const dynamicReq = req as DynamicRequest
  try {
    const { appId, tableName } = dynamicReq.params
    const tableConfig = dynamicReq.appConfig!.database.tables.find((t) => t.name === tableName)!

    // Validate schema
    const schema = SchemaBuilder.buildZodSchema(tableConfig.fields)
    const strippedData = SchemaBuilder.stripUnknownFields(dynamicReq.body, tableConfig.fields)
    const validatedData = schema.parse(strippedData)

    const query = QueryBuilder.buildCreateQuery(
      appId,
      tableName,
      dynamicReq.user!.id,
      validatedData
    )
    const record = await prisma.appData.create(query)

    // We can just set the header if the config *has* a matching event.
    const hasEvent = dynamicReq.appConfig?.notifications?.events?.some(
      (e) => e.trigger === 'onCreate' && e.tableRef === tableName
    )
    if (hasEvent) {
      res.setHeader('X-Notification-Sent', 'true')
      NotificationService.send(
        dynamicReq.appConfig!,
        'onCreate',
        tableName,
        record.rowData as Record<string, unknown>
      )
    }

    res.status(201).json({
      data: {
        id: record.id,
        ...(record.rowData as Record<string, unknown>),
      },
    })
  } catch (error) {
    next(error)
  }
}

export async function updateRecord(req: Request, res: Response, next: NextFunction): Promise<void> {
  const dynamicReq = req as DynamicRequest
  try {
    const { appId, tableName, id } = dynamicReq.params
    const tableConfig = dynamicReq.appConfig!.database.tables.find((t) => t.name === tableName)!

    const whereClause: Prisma.AppDataWhereInput = { id, appId, tableName }
    if (dynamicReq.appConfig?.auth.userScoped && dynamicReq.user?.id) {
      whereClause.createdBy = dynamicReq.user.id
    }

    // Verify ownership/existence first
    const existing = await prisma.appData.findFirst({ where: whereClause })
    if (!existing) {
      res.status(404).json({ error: 'Record not found', code: 'NOT_FOUND' })
      return
    }

    const schema = SchemaBuilder.buildZodSchema(tableConfig.fields)
    // Use deep partial schema for update? Prompt says "validate body, patch row_data".
    // A standard patch might only contain partial fields. Let's make the schema partial for update.
    const strippedData = SchemaBuilder.stripUnknownFields(dynamicReq.body, tableConfig.fields)
    const validatedData = schema.partial().parse(strippedData)

    // Merge existing row data with validated data
    const mergedData = { ...(existing.rowData as Record<string, unknown>), ...validatedData }

    const query = QueryBuilder.buildUpdateQuery(id, mergedData)
    const record = await prisma.appData.update(query)

    const hasEvent = dynamicReq.appConfig?.notifications?.events?.some(
      (e) => e.trigger === 'onUpdate' && e.tableRef === tableName
    )
    if (hasEvent) {
      res.setHeader('X-Notification-Sent', 'true')
      NotificationService.send(
        dynamicReq.appConfig!,
        'onUpdate',
        tableName,
        record.rowData as Record<string, unknown>
      )
    }

    res.json({
      data: {
        id: record.id,
        ...(record.rowData as Record<string, unknown>),
      },
    })
  } catch (error) {
    next(error)
  }
}

export async function deleteRecord(req: Request, res: Response, next: NextFunction): Promise<void> {
  const dynamicReq = req as DynamicRequest
  try {
    const { appId, tableName, id } = dynamicReq.params

    const whereClause: Prisma.AppDataWhereInput = { id, appId, tableName }
    if (dynamicReq.appConfig?.auth.userScoped && dynamicReq.user?.id) {
      whereClause.createdBy = dynamicReq.user.id
    }

    const existing = await prisma.appData.findFirst({ where: whereClause })
    if (!existing) {
      res.status(404).json({ error: 'Record not found', code: 'NOT_FOUND' })
      return
    }

    const query = QueryBuilder.buildDeleteQuery(id, appId)
    await prisma.appData.delete(query)

    const hasEvent = dynamicReq.appConfig?.notifications?.events?.some(
      (e) => e.trigger === 'onDelete' && e.tableRef === tableName
    )
    if (hasEvent) {
      res.setHeader('X-Notification-Sent', 'true')
      NotificationService.send(
        dynamicReq.appConfig!,
        'onDelete',
        tableName,
        existing.rowData as Record<string, unknown>
      )
    }

    res.json({ data: { success: true } })
  } catch (error) {
    next(error)
  }
}
