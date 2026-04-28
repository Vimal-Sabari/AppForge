import { AppConfig, AppConfigSchema } from 'shared-types'

type DeepPartialConfig = {
  version?: string
  name?: string
  auth?: { enabled?: boolean; methods?: string[]; userScoped?: boolean }
  ui?: {
    theme?: string
    language?: string
    pages?: {
      id?: string
      path?: string
      title?: string
      components?: { id?: string; type?: string }[]
    }[]
  }
  database?: {
    tables?: { name?: string; fields?: { name?: string; type?: string; required?: boolean }[] }[]
  }
}

export function parseConfig(raw: unknown): {
  config: AppConfig | null
  warnings: string[]
  errors: string[]
} {
  const warnings: string[] = []
  const errors: string[] = []

  if (!raw || typeof raw !== 'object') {
    errors.push('Config must be a JSON object')
    return { config: null, warnings, errors }
  }

  const normalized = { ...(raw as Record<string, unknown>) } as DeepPartialConfig

  if (!normalized.version) {
    warnings.push('version missing, defaulted to "1.0"')
    normalized.version = '1.0'
  }

  if (!normalized.name) {
    warnings.push('name missing, defaulted to "Untitled App"')
    normalized.name = 'Untitled App'
  }

  if (!normalized.auth) {
    warnings.push('auth section missing, using defaults')
    normalized.auth = { enabled: true, methods: ['email'], userScoped: true }
  } else {
    if (typeof normalized.auth.enabled !== 'boolean') normalized.auth.enabled = true
    if (!Array.isArray(normalized.auth.methods)) normalized.auth.methods = ['email']
    if (typeof normalized.auth.userScoped !== 'boolean') normalized.auth.userScoped = true
  }

  if (!normalized.ui) {
    warnings.push('ui section missing, using defaults')
    normalized.ui = { theme: 'light', language: 'en', pages: [] }
  } else {
    if (!['light', 'dark', 'auto'].includes(normalized.ui.theme as string))
      normalized.ui.theme = 'light'
    if (!Array.isArray(normalized.ui.pages)) {
      warnings.push('ui.pages is not an array, defaulting to []')
      normalized.ui.pages = []
    } else {
      normalized.ui.pages.forEach((page, pIdx) => {
        if (!page.id) page.id = `page-${pIdx}`
        if (!page.path) page.path = `/${page.id}`
        if (!page.title) page.title = `Page ${pIdx}`
        if (!Array.isArray(page.components)) {
          warnings.push(`ui.pages[${pIdx}].components is invalid, defaulting to []`)
          page.components = []
        } else {
          page.components.forEach((comp, cIdx) => {
            if (!comp.id) comp.id = `comp-${pIdx}-${cIdx}`
            if (!['form', 'table', 'dashboard', 'chart', 'text'].includes(comp.type as string)) {
              warnings.push(`unknown component type '${comp.type}', coerced to 'unknown'`)
              comp.type = 'unknown'
            }
          })
        }
      })
    }
  }

  if (!normalized.database) {
    warnings.push('database section missing')
    normalized.database = { tables: [] }
  } else if (!Array.isArray(normalized.database.tables)) {
    warnings.push('database.tables invalid, defaulted to []')
    normalized.database.tables = []
  } else {
    normalized.database.tables.forEach((table, tIdx) => {
      if (!table.name) table.name = `table_${tIdx}`
      if (!Array.isArray(table.fields)) {
        warnings.push(`database.tables[${tIdx}].fields invalid, defaulted to []`)
        table.fields = []
      } else {
        table.fields.forEach((field, fIdx) => {
          if (!field.name) field.name = `field_${fIdx}`
          if (
            !['text', 'number', 'boolean', 'date', 'email', 'select', 'textarea', 'file'].includes(
              field.type as string
            )
          ) {
            warnings.push(`unknown field type '${field.type}', coerced to 'text'`)
            field.type = 'text'
          }
        })
      }
    })
  }

  if (process.env.NODE_ENV === 'development' && warnings.length > 0) {
    console.warn('Config Parser Warnings:', warnings)
  }

  const result = AppConfigSchema.safeParse(normalized)

  if (!result.success) {
    const zodErrors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`)
    errors.push(...zodErrors)
    return { config: normalized as AppConfig, warnings, errors }
  }

  return { config: result.data, warnings, errors }
}
