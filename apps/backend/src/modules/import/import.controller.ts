import { Request, Response, NextFunction } from 'express'
import Papa from 'papaparse'
import { ConfigCache } from '../../core/ConfigCache'
import { SchemaBuilder } from '../../core/SchemaBuilder'
import { prisma } from '../../core/prisma'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { TableConfig, FieldConfig } from 'shared-types'

interface RowError {
  row: number
  errors: string[]
}

export async function importCsv(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { appId, tableName } = req.params
    const userId = (req as any).user?.id // eslint-disable-line @typescript-eslint/no-explicit-any

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' })
      return
    }

    if (!req.file) {
      res.status(400).json({ error: 'No CSV file provided' })
      return
    }

    const result = await ConfigCache.getConfig(appId)
    if (!result) {
      res.status(404).json({ error: 'App configuration not found', code: 'APP_NOT_FOUND' })
      return
    }

    const { config, userId: appUserId } = result

    // Security: Ensure the app belongs to the authenticated user
    if (appUserId !== userId) {
      res.status(404).json({ error: 'App not found', code: 'NOT_FOUND' })
      return
    }

    const tableConfig = config.database.tables.find((t: TableConfig) => t.name === tableName)
    if (!tableConfig) {
      res.status(404).json({
        error: `Table '${tableName}' not found in app configuration`,
        code: 'TABLE_NOT_FOUND',
      })
      return
    }

    // Optional user-provided mapping: Record<CsvHeader, FieldName>
    let mapping: Record<string, string> = {}
    if (req.body.mapping) {
      try {
        mapping = JSON.parse(req.body.mapping)
      } catch (e) {
        // invalid mapping JSON, ignore or throw
      }
    }

    const csvContent = req.file.buffer.toString('utf-8')

    // Parse CSV
    const parsed = Papa.parse<Record<string, unknown>>(csvContent, {
      header: true,
      skipEmptyLines: true,
    })

    if (parsed.errors.length > 0) {
      // Just take the first few errors
      res.status(400).json({
        error: 'Invalid CSV format',
        details: parsed.errors.map((e) => e.message),
      })
      return
    }

    let rows = parsed.data
    if (rows.length > 1000) {
      rows = rows.slice(0, 1000)
    }

    if (rows.length === 0) {
      res.json({ imported: 0, skipped: 0, warnings: ['CSV is empty'], errors: [] })
      return
    }

    const headers = parsed.meta.fields || []
    const warnings: string[] = []

    // AUTO-MAPPING if not provided
    const fieldNames = tableConfig.fields.map((f: FieldConfig) => f.name)
    const fieldNamesLower = fieldNames.map((f: string) => f.toLowerCase())

    const effectiveMapping: Record<string, string> = {}

    for (const header of headers) {
      if (mapping[header]) {
        effectiveMapping[header] = mapping[header]
      } else {
        const cleanHeader = header.trim()
        const lowerHeader = cleanHeader.toLowerCase()
        const idx = fieldNamesLower.indexOf(lowerHeader)
        if (idx !== -1) {
          effectiveMapping[header] = fieldNames[idx]
        } else {
          warnings.push(`Unmatched CSV column: '${header}'`)
        }
      }
    }

    const schema = SchemaBuilder.buildZodSchema(tableConfig.fields)
    const validRows: Record<string, unknown>[] = []
    const rowErrors: RowError[] = []

    rows.forEach((row, index) => {
      // Map row
      const mappedRow: Record<string, unknown> = {}
      for (const [csvHeader, value] of Object.entries(row)) {
        const targetField = effectiveMapping[csvHeader]
        if (targetField) {
          // Keep string, SchemaBuilder handles coercion if zod uses coerce
          mappedRow[targetField] = value
        }
      }

      // We need to parse boolean and numbers if Zod doesn't strictly coerce them.
      // SchemaBuilder uses z.coerce for numbers and booleans! So we are good.
      const strippedData = SchemaBuilder.stripUnknownFields(mappedRow, tableConfig.fields)

      try {
        const validated = schema.parse(strippedData)
        validRows.push(validated)
      } catch (err) {
        if (err instanceof z.ZodError) {
          rowErrors.push({
            row: index + 1,
            errors: err.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
          })
        } else {
          rowErrors.push({
            row: index + 1,
            errors: ['Unknown validation error'],
          })
        }
      }
    })

    if (validRows.length > 0) {
      const createData = validRows.map((rowData) => ({
        appId,
        tableName,
        rowData: rowData as Prisma.InputJsonValue,
        createdBy: userId,
      }))

      await prisma.appData.createMany({
        data: createData,
      })
    }

    res.json({
      imported: validRows.length,
      skipped: rowErrors.length,
      warnings,
      errors: rowErrors,
    })
  } catch (error) {
    next(error)
  }
}
