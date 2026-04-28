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
          fieldSchema = z.string()
          break
        case 'number':
          fieldSchema = z.number()
          if (field.validation?.min !== undefined)
            fieldSchema = (fieldSchema as z.ZodNumber).min(field.validation.min)
          if (field.validation?.max !== undefined)
            fieldSchema = (fieldSchema as z.ZodNumber).max(field.validation.max)
          break
        case 'boolean':
          fieldSchema = z.boolean()
          break
        case 'date':
          fieldSchema = z.string().datetime()
          break
        case 'email':
          fieldSchema = z.string().email()
          break
        case 'select':
          if (field.options && field.options.length > 0) {
            fieldSchema = z.enum(field.options as [string, ...string[]])
          } else {
            fieldSchema = z.string()
          }
          break
        case 'textarea':
          fieldSchema = z.string().max(5000)
          break
        case 'file':
          fieldSchema = z.string()
          break
        default:
          fieldSchema = z.any()
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
