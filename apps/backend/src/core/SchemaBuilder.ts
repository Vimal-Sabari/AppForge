import { z } from 'zod'
import { FieldConfig } from 'shared-types'

export class SchemaBuilder {
  /**
   * Builds a Zod schema from an array of field configurations.
   * @param fields The array of field configs.
   * @returns A Zod object schema.
   */
  static buildZodSchema(fields: FieldConfig[]): z.ZodObject<Record<string, z.ZodTypeAny>> {
    const shape: Record<string, z.ZodTypeAny> = {}

    for (const field of fields) {
      let fieldSchema: z.ZodTypeAny

      switch (field.type) {
        case 'text':
        case 'textarea':
        case 'email':
        case 'date':
        case 'file':
          if (field.type === 'email') fieldSchema = z.string().email()
          else if (field.type === 'date') {
            // Support both ISO datetime and YYYY-MM-DD strings
            fieldSchema = z.string().refine((val) => !isNaN(Date.parse(val)), {
              message: 'Invalid date format',
            })
          } else if (field.type === 'textarea') fieldSchema = z.string().max(5000)
          else fieldSchema = z.string()

          if (field.validation?.min !== undefined)
            fieldSchema = (fieldSchema as z.ZodString).min(field.validation.min)
          if (field.validation?.max !== undefined)
            fieldSchema = (fieldSchema as z.ZodString).max(field.validation.max)
          break
        case 'number':
          fieldSchema = z.coerce.number()
          if (field.validation?.min !== undefined)
            fieldSchema = (fieldSchema as z.ZodNumber).min(field.validation.min)
          if (field.validation?.max !== undefined)
            fieldSchema = (fieldSchema as z.ZodNumber).max(field.validation.max)
          break
        case 'boolean':
          fieldSchema = z.preprocess((value) => {
            if (value === 'true') return true
            if (value === 'false') return false
            return value
          }, z.boolean())
          break
        case 'select':
          if (field.options && field.options.length > 0) {
            fieldSchema = z.enum(field.options as [string, ...string[]])
          } else {
            fieldSchema = z.string()
          }
          break
        default:
          fieldSchema = z.string()
      }

      if (field.validation?.pattern && field.type !== 'number' && field.type !== 'boolean') {
        fieldSchema = (fieldSchema as z.ZodString).regex(new RegExp(field.validation.pattern))
      }

      if (!field.required) {
        fieldSchema = fieldSchema.optional().nullable()
      }

      shape[field.name] = fieldSchema
    }

    return z.object(shape).strict()
  }

  /**
   * Strips any keys from the data object that are not defined in the fields.
   * @param data The raw data object.
   * @param fields The allowed field configurations.
   * @returns A new object with only known fields.
   */
  static stripUnknownFields(
    data: Record<string, unknown>,
    fields: FieldConfig[]
  ): Record<string, unknown> {
    const knownKeys = new Set(fields.map((f) => f.name))
    const result: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(data)) {
      if (knownKeys.has(key)) {
        result[key] = value
      }
    }

    return result
  }
}
