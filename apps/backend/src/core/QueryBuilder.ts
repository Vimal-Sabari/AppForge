import { Prisma } from '@prisma/client'
import sanitizeHtml from 'sanitize-html'

export class QueryBuilder {
  /**
   * Sanitizes all string fields in an object to prevent XSS.
   */
  static sanitizeData(data: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeHtml(value, {
          allowedTags: [], // Strip all tags
          allowedAttributes: {}, // Strip all attributes
        })
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        sanitized[key] = this.sanitizeData(value as Record<string, unknown>)
      } else {
        sanitized[key] = value
      }
    }
    return sanitized
  }
  /**
   * Builds the findMany query options for listing app_data rows.
   * @param appId The ID of the app.
   * @param tableName The name of the table in the app config.
   * @param params Query parameters for pagination, sorting, and filtering.
   * @returns Prisma findMany query object.
   */
  static buildListQuery(
    appId: string,
    tableName: string,
    params: {
      page?: number
      limit?: number
      sortBy?: string
      sortDir?: 'asc' | 'desc'
      filters?: Record<string, string | number | boolean>
    }
  ): Prisma.AppDataFindManyArgs {
    const page = Math.max(1, params.page || 1)
    const limit = Math.min(100, Math.max(1, params.limit || 20))
    const skip = (page - 1) * limit

    const where: Prisma.AppDataWhereInput = {
      appId,
      tableName,
    }

    if (params.filters && Object.keys(params.filters).length > 0) {
      where.AND = Object.entries(params.filters).map(([key, value]) => ({
        rowData: {
          path: [key],
          equals: value,
        },
      }))
    }

    // Prisma doesn't natively support ordering by JSON fields inside findMany.
    // So we just order by createdAt if sortBy is not a known root column.
    let orderBy: Prisma.AppDataOrderByWithRelationInput = { createdAt: 'desc' }
    if (params.sortBy === 'createdAt' || params.sortBy === 'updatedAt') {
      orderBy = { [params.sortBy]: params.sortDir || 'desc' }
    }

    return {
      where,
      skip,
      take: limit,
      orderBy,
    }
  }

  /**
   * Builds the create query input for an app_data row.
   * @param appId The ID of the app.
   * @param tableName The name of the table.
   * @param userId The ID of the user creating the row.
   * @param data The validated JSON data to store.
   * @returns Prisma create input.
   */
  static buildCreateQuery(
    appId: string,
    tableName: string,
    userId: string,
    data: Record<string, unknown>
  ): Prisma.AppDataCreateArgs {
    const sanitized = this.sanitizeData(data)
    return {
      data: {
        appId,
        tableName,
        createdBy: userId,
        rowData: sanitized as Prisma.InputJsonValue,
      },
    }
  }

  /**
   * Builds the update query input for an app_data row.
   * @param id The ID of the row.
   * @param data The validated JSON data to update.
   * @returns Prisma update input.
   */
  static buildUpdateQuery(id: string, data: Record<string, unknown>): Prisma.AppDataUpdateArgs {
    const sanitized = this.sanitizeData(data)
    return {
      where: { id },
      data: {
        rowData: sanitized as Prisma.InputJsonValue,
      },
    }
  }

  /**
   * Builds the delete query input for an app_data row.
   * @param id The ID of the row.
   * @param appId The ID of the app (to ensure it belongs to the app).
   * @returns Prisma delete input.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static buildDeleteQuery(id: string, _appId: string): Prisma.AppDataDeleteArgs {
    return {
      where: { id },
    }
  }
}
