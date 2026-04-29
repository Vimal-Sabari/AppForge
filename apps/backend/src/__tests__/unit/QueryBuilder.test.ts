import { QueryBuilder } from '../../core/QueryBuilder'

describe('QueryBuilder', () => {
  const appId = 'test-app-id'
  const tableName = 'test-table'

  it('should build correct pagination for list query', () => {
    const params = { page: 2, limit: 20 }
    const query = QueryBuilder.buildListQuery(appId, tableName, params)

    expect(query.skip).toBe(20)
    expect(query.take).toBe(20)
  })

  it('should cap limit at 100', () => {
    const params = { limit: 500 }
    const query = QueryBuilder.buildListQuery(appId, tableName, params)

    expect(query.take).toBe(100)
  })

  it('should default sort direction to DESC', () => {
    const params = { sortBy: 'createdAt' }
    const query = QueryBuilder.buildListQuery(appId, tableName, params)

    expect(query.orderBy).toEqual({ createdAt: 'desc' })
  })

  it('should apply filters to where clause', () => {
    const params = {
      filters: {
        name: 'John',
        age: 30,
      },
    }
    const query = QueryBuilder.buildListQuery(appId, tableName, params)

    expect(query.where).toHaveProperty('AND')
    const and = query.where?.AND as unknown[]
    expect(and).toContainEqual({
      rowData: {
        path: ['name'],
        equals: 'John',
      },
    })
    expect(and).toContainEqual({
      rowData: {
        path: ['age'],
        equals: 30,
      },
    })
  })

  it('should handle multiple filters correctly', () => {
    const params = {
      filters: {
        status: 'active',
        type: 'user',
      },
    }
    const query = QueryBuilder.buildListQuery(appId, tableName, params)

    expect(query.where).toHaveProperty('AND')
    expect(Array.isArray(query.where?.AND)).toBe(true)
  })
})
