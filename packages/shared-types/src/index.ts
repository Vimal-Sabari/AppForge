export interface AppConfig {
  version: string
  name: string
  description: string
  auth: {
    enabled: boolean
    methods: string[]
    userScoped: boolean
  }
  database: {
    tables: TableConfig[]
  }
  ui: {
    theme: string
    language: string
    pages: PageConfig[]
  }
}

export interface TableConfig {
  name: string
  displayName: string
  fields: FieldConfig[]
}

export interface FieldConfig {
  name: string
  type: string
  label: string
  required?: boolean
  options?: string[]
  defaultValue?: unknown
}

export interface PageConfig {
  id: string
  path: string
  title: string
  components: ComponentConfig[]
}

export interface ComponentConfig {
  id: string
  type: string
  tableRef?: string
  title?: string
  actions?: string[]
}
