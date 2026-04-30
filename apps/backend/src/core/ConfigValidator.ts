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
  notifications?: {
    events?: {
      trigger?: string
      tableRef?: string
      template?: { subject?: string; body?: string }
    }[]
  }
}

export class ConfigValidator {
  static validateConfig(raw: unknown): { valid: boolean; config: AppConfig; warnings: string[] } {
    const warnings: string[] = []

    if (!raw || typeof raw !== 'object') {
      return { valid: false, config: {} as AppConfig, warnings: ['Config is not an object'] }
    }

    // ── Pre-normalization: map simplified / alternative formats to full schema ──
    const input = { ...(raw as Record<string, unknown>) }

    // 1. Top-level `pages` → `ui.pages`
    if (Array.isArray(input['pages']) && !input['ui']) {
      warnings.push('Mapped top-level "pages" → "ui.pages"')
      input['ui'] = { theme: 'light', language: 'en', pages: input['pages'] }
      delete input['pages']
    }

    // 2. Top-level `dataSources` → `database.tables`
    if (Array.isArray(input['dataSources']) && !input['database']) {
      warnings.push('Mapped top-level "dataSources" → "database.tables"')
      const tables = (input['dataSources'] as Record<string, unknown>[]).map((ds) => ({
        name: ds['name'] || 'table',
        fields: [],
      }))
      input['database'] = { tables }
      delete input['dataSources']
    }

    // 3. Normalize pages inside ui
    const uiSection = input['ui'] as Record<string, unknown> | undefined
    if (uiSection && Array.isArray(uiSection['pages'])) {
      uiSection['pages'] = (uiSection['pages'] as Record<string, unknown>[]).map((page, pIdx) => {
        const p = { ...page }

        // page.name → page.title
        if (!p['title'] && p['name']) {
          p['title'] = p['name']
          delete p['name']
        }

        // Normalize components
        if (Array.isArray(p['components'])) {
          p['components'] = (p['components'] as Record<string, unknown>[]).map((comp, cIdx) => {
            const c = { ...comp }

            // component.dataSource → component.tableRef
            if (!c['tableRef'] && c['dataSource']) {
              c['tableRef'] = c['dataSource']
              delete c['dataSource']
            }

            // component.fields (rich objects) → array of field name strings
            // (the schema only stores field name references for table/form components)
            if (Array.isArray(c['fields'])) {
              const fields = c['fields'] as unknown[]
              if (fields.length > 0 && typeof fields[0] === 'object') {
                // Rich field objects: extract name/key strings for the component ref
                c['fields'] = (fields as Record<string, unknown>[]).map(
                  (f) => (f['key'] || f['name'] || `field_${cIdx}`) as string
                )
              }
            }

            // Coerce unknown actions format: array of objects → array of action type strings
            if (Array.isArray(c['actions'])) {
              const actions = c['actions'] as unknown[]
              if (actions.length > 0 && typeof actions[0] === 'object') {
                c['actions'] = (actions as Record<string, unknown>[]).map((a) =>
                  String(a['type'] || 'read')
                )
              }
            }

            // Normalize component id
            if (!c['id']) c['id'] = `comp-${pIdx}-${cIdx}`

            return c
          })
        }

        return p
      })
    }

    // 4. Field-level type coercions inside database.tables
    const dbSection = input['database'] as Record<string, unknown> | undefined
    if (dbSection && Array.isArray(dbSection['tables'])) {
      const typeMap: Record<string, string> = {
        checkbox: 'boolean',
        string: 'text',
        integer: 'number',
        float: 'number',
        datetime: 'date',
        timestamp: 'date',
      }
      ;(dbSection['tables'] as Record<string, unknown>[]).forEach((table) => {
        if (Array.isArray(table['fields'])) {
          ;(table['fields'] as Record<string, unknown>[]).forEach((field) => {
            const t = field['type'] as string
            if (t && typeMap[t]) {
              warnings.push(`Coerced field type "${t}" → "${typeMap[t]}"`)
              field['type'] = typeMap[t]
            }
          })
        }
      })
    }
    // ── End pre-normalization ─────────────────────────────────────────────────

    const normalized = input as DeepPartialConfig

    if (!normalized.version) {
      warnings.push('version missing, defaulted to "1.0"')
      normalized.version = '1.0'
    }

    if (!normalized.name || normalized.name.trim() === '') {
      return { valid: false, config: normalized as AppConfig, warnings: ['name is required'] }
    }

    if (!normalized.auth) {
      warnings.push('auth missing, applied sensible defaults')
      normalized.auth = { enabled: true, methods: ['email'], userScoped: true }
    } else {
      if (typeof normalized.auth.enabled !== 'boolean') {
        warnings.push('auth.enabled invalid, defaulted to true')
        normalized.auth.enabled = true
      }
      if (!Array.isArray(normalized.auth.methods)) {
        warnings.push('auth.methods invalid, defaulted to ["email"]')
        normalized.auth.methods = ['email']
      }
      if (typeof normalized.auth.userScoped !== 'boolean') {
        warnings.push('auth.userScoped invalid, defaulted to true')
        normalized.auth.userScoped = true
      }
    }

    if (!normalized.ui) {
      warnings.push('ui section missing, applied defaults')
      normalized.ui = { theme: 'light', language: 'en', pages: [] }
    } else {
      if (!['light', 'dark', 'auto'].includes(normalized.ui.theme as string)) {
        warnings.push(`invalid ui.theme '${normalized.ui.theme}', defaulted to 'light'`)
        normalized.ui.theme = 'light'
      }
      if (!normalized.ui.pages || !Array.isArray(normalized.ui.pages)) {
        warnings.push('ui.pages missing or invalid, defaulted to []')
        normalized.ui.pages = []
      } else {
        normalized.ui.pages.forEach((page, pIdx) => {
          if (!page.id) page.id = `page-${pIdx}`
          if (!page.path) page.path = `/${page.id}`
          if (!page.title) page.title = `Page ${pIdx}`
          if (!page.components || !Array.isArray(page.components)) {
            warnings.push(`ui.pages[${pIdx}].components missing or invalid, defaulted to []`)
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
      warnings.push('database section missing, defaulted to empty tables list')
      normalized.database = { tables: [] }
    } else if (!Array.isArray(normalized.database.tables)) {
      warnings.push('database.tables invalid, defaulted to empty list')
      normalized.database.tables = []
    } else {
      normalized.database.tables.forEach((table, tIdx) => {
        if (!table.name) table.name = `table_${tIdx}`
        if (!table.fields || !Array.isArray(table.fields)) {
          warnings.push(`database.tables[${tIdx}].fields invalid, defaulted to []`)
          table.fields = []
        } else {
          table.fields.forEach((field, fIdx) => {
            if (!field.name) field.name = `field_${fIdx}`
            if (
              ![
                'text',
                'number',
                'boolean',
                'date',
                'email',
                'select',
                'textarea',
                'file',
              ].includes(field.type as string)
            ) {
              warnings.push(
                `unknown field type '${field.type}' for field '${field.name}', coerced to 'text'`
              )
              field.type = 'text'
            }
            if (typeof field.required !== 'boolean') {
              warnings.push(`field.required for '${field.name}' invalid, defaulted to false`)
              field.required = false
            }
            if (
              field.type === 'select' &&
              (!('options' in field) ||
                !Array.isArray((field as { options?: unknown }).options) ||
                (field as { options?: unknown[] }).options?.length === 0)
            ) {
              warnings.push(`select field '${field.name}' has no options, coerced to 'text'`)
              field.type = 'text'
            }
          })
        }
      })
    }

    const result = AppConfigSchema.safeParse(normalized)

    if (!result.success) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      warnings.push(...result.error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`))
      return { valid: false, config: normalized as AppConfig, warnings }
    }

    return { valid: true, config: result.data, warnings }
  }
}
