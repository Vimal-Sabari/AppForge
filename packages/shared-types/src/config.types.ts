import { z } from 'zod'

export const FieldConfigSchema = z.object({
  name: z.string(),
  type: z.enum(['text', 'number', 'boolean', 'date', 'email', 'select', 'textarea', 'file']),
  label: z.string().optional(),
  required: z.boolean().optional(),
  defaultValue: z.unknown().optional(),
  options: z.array(z.string()).optional(),
  validation: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
      pattern: z.string().optional(),
    })
    .optional(),
})

export const TableConfigSchema = z.object({
  name: z.string(),
  displayName: z.string().optional(),
  fields: z.array(FieldConfigSchema),
})

export const ComponentConfigSchema = z.object({
  id: z.string(),
  type: z.enum(['form', 'table', 'dashboard', 'chart', 'text', 'unknown']),
  title: z.string().optional(),
  tableRef: z.string().optional(),
  fields: z.array(z.string()).optional(),
  actions: z.array(z.enum(['create', 'read', 'update', 'delete'])).optional(),
  chartConfig: z
    .object({
      type: z.enum(['bar', 'line', 'pie']),
      xField: z.string(),
      yField: z.string(),
    })
    .optional(),
})

export const PageConfigSchema = z.object({
  id: z.string(),
  path: z.string(),
  title: z.string(),
  components: z.array(ComponentConfigSchema),
})

export const CustomEndpointConfigSchema = z.object({
  path: z.string(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE']),
  tableRef: z.string(),
  filters: z.record(z.string(), z.unknown()).optional(),
})

export const NotificationEventSchema = z.object({
  trigger: z.enum(['onCreate', 'onUpdate', 'onDelete']),
  tableRef: z.string(),
  template: z.object({
    subject: z.string(),
    body: z.string(),
  }),
})

export const AppConfigSchema = z.object({
  version: z.string(),
  name: z.string(),
  description: z.string().optional(),
  auth: z.object({
    enabled: z.boolean(),
    methods: z.array(z.enum(['email', 'google'])),
    userScoped: z.boolean(),
  }),
  database: z.object({
    tables: z.array(TableConfigSchema),
  }),
  ui: z.object({
    theme: z.enum(['light', 'dark', 'auto']).optional(),
    language: z.string().optional(),
    pages: z.array(PageConfigSchema),
  }),
  api: z
    .object({
      customEndpoints: z.array(CustomEndpointConfigSchema).optional(),
    })
    .optional(),
  notifications: z
    .object({
      events: z.array(NotificationEventSchema),
    })
    .optional(),
})

export type FieldConfig = z.infer<typeof FieldConfigSchema>
export type TableConfig = z.infer<typeof TableConfigSchema>
export type ComponentConfig = z.infer<typeof ComponentConfigSchema>
export type PageConfig = z.infer<typeof PageConfigSchema>
export type CustomEndpointConfig = z.infer<typeof CustomEndpointConfigSchema>
export type NotificationEvent = z.infer<typeof NotificationEventSchema>
export type AppConfig = z.infer<typeof AppConfigSchema>
