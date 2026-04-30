import { ConfigValidator } from '../../core/ConfigValidator'

describe('ConfigValidator', () => {
  it('should validate a complete valid config', () => {
    const config = {
      version: '1.0',
      name: 'Test App',
      auth: {
        enabled: true,
        methods: ['email'],
        userScoped: true,
      },
      ui: {
        theme: 'light',
        language: 'en',
        pages: [
          {
            id: 'page1',
            path: '/page1',
            title: 'Page 1',
            components: [{ id: 'comp1', type: 'text', title: 'Welcome' }],
          },
        ],
      },
      database: {
        tables: [
          {
            name: 'users',
            fields: [{ name: 'email', type: 'email', label: 'Email', required: true }],
          },
        ],
      },
    }

    const result = ConfigValidator.validateConfig(config)
    expect(result.valid).toBe(true)
    expect(result.warnings.filter((w) => !w.includes('applied defaults')).length).toBe(0)
  })

  it('should add warnings for missing auth block and provide defaults', () => {
    const config = {
      version: '1.0',
      name: 'No Auth App',
      ui: {
        pages: [{ id: 'p1', path: '/', title: 'Home', components: [] }],
      },
      database: { tables: [] },
    }

    const result = ConfigValidator.validateConfig(config as unknown)
    expect(result.valid).toBe(true)
    expect(result.warnings.some((w) => w.includes('auth missing'))).toBe(true)
  })

  it('should coerce unknown component types to "unknown" with a warning', () => {
    const config = {
      version: '1.0',
      name: 'Test App',
      ui: {
        pages: [
          {
            id: 'p1',
            path: '/',
            title: 'Home',
            components: [{ id: 'c1', type: 'weird-type' }],
          },
        ],
      },
      database: { tables: [] },
    }

    const result = ConfigValidator.validateConfig(config as unknown)
    expect(result.valid).toBe(true)
    expect(result.warnings.some((w) => w.includes("unknown component type 'weird-type'"))).toBe(
      true
    )
  })

  it('should reject config with empty name', () => {
    const config = {
      version: '1.0',
      name: '',
      ui: { pages: [] },
      database: { tables: [] },
    }

    const result = ConfigValidator.validateConfig(config as unknown)
    expect(result.valid).toBe(false)
  })

  it('should allow config with no pages for empty-state rendering', () => {
    const config = {
      version: '1.0',
      name: 'No Pages',
      ui: { pages: [] },
      database: { tables: [] },
    }

    const result = ConfigValidator.validateConfig(config as unknown)
    expect(result.valid).toBe(true)
    expect(result.config.ui.pages).toEqual([])
  })

  it('should normalize partial fields correctly', () => {
    const config = {
      name: 'Partial App',
      ui: {
        pages: [{ title: 'Home', components: [{ type: 'text' }] }],
      },
      database: {
        tables: [{ fields: [{ type: 'text' }] }],
      },
    }

    const result = ConfigValidator.validateConfig(config as unknown)
    expect(result.valid).toBe(true)
    const normalized = result.config!
    expect(normalized.version).toBe('1.0')
    expect(normalized.ui.pages[0].id).toBeDefined()
    expect(normalized.database.tables[0].name).toBeDefined()
  })

  it('should coerce select fields without options to text', () => {
    const config = {
      version: '1.0',
      name: 'Select App',
      ui: { pages: [] },
      database: {
        tables: [{ name: 'tasks', fields: [{ name: 'status', type: 'select' }] }],
      },
    }

    const result = ConfigValidator.validateConfig(config as unknown)
    expect(result.valid).toBe(true)
    expect(result.config.database.tables[0].fields[0].type).toBe('text')
    expect(result.warnings.some((warning) => warning.includes('has no options'))).toBe(true)
  })
})
