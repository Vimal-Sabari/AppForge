import { SchemaBuilder } from '../../core/SchemaBuilder'
import { FieldConfig } from 'shared-types'

describe('SchemaBuilder', () => {
  it('should build a valid zod schema for all supported field types', () => {
    const fields: FieldConfig[] = [
      { name: 'name', type: 'text', label: 'Name', required: true },
      { name: 'age', type: 'number', label: 'Age' },
      { name: 'active', type: 'boolean', label: 'Active' },
      { name: 'email', type: 'email', label: 'Email' },
      { name: 'bio', type: 'textarea', label: 'Bio' },
      { name: 'birthday', type: 'date', label: 'Birthday' },
      {
        name: 'role',
        type: 'select',
        label: 'Role',
        options: ['admin', 'user'],
      },
    ]

    const schema = SchemaBuilder.buildZodSchema(fields)

    const validData = {
      name: 'John Doe',
      age: 30,
      active: true,
      email: 'john@example.com',
      bio: 'Hello world',
      birthday: '1990-01-01T00:00:00Z',
      role: 'admin',
    }

    expect(() => schema.parse(validData)).not.toThrow()
  })

  it('should reject invalid data for numeric fields', () => {
    const fields: FieldConfig[] = [{ name: 'age', type: 'number', label: 'Age' }]
    const schema = SchemaBuilder.buildZodSchema(fields)

    expect(() => schema.parse({ age: 'not-a-number' })).toThrow()
  })

  it('should apply min and max validation for numbers', () => {
    const fields: FieldConfig[] = [
      {
        name: 'score',
        type: 'number',
        label: 'Score',
        validation: { min: 0, max: 100 },
      },
    ]
    const schema = SchemaBuilder.buildZodSchema(fields)

    expect(() => schema.parse({ score: 50 })).not.toThrow()
    expect(() => schema.parse({ score: -1 })).toThrow()
    expect(() => schema.parse({ score: 101 })).toThrow()
  })

  it('should apply min and max length for strings', () => {
    const fields: FieldConfig[] = [
      {
        name: 'username',
        type: 'text',
        label: 'Username',
        validation: { min: 3, max: 10 },
      },
    ]
    const schema = SchemaBuilder.buildZodSchema(fields)

    expect(() => schema.parse({ username: 'abc' })).not.toThrow()
    expect(() => schema.parse({ username: 'ab' })).toThrow()
    expect(() => schema.parse({ username: 'verylongusername' })).toThrow()
  })

  it('should default unknown field types to string', () => {
    const fields: unknown[] = [{ name: 'something', type: 'unknown-type', label: 'Something' }]
    const schema = SchemaBuilder.buildZodSchema(fields as FieldConfig[])

    expect(() => schema.parse({ something: 'test' })).not.toThrow()
    expect(() => schema.parse({ something: 123 })).toThrow()
  })

  it('should create z.enum for select types', () => {
    const fields: FieldConfig[] = [
      {
        name: 'status',
        type: 'select',
        label: 'Status',
        options: ['pending', 'completed'],
      },
    ]
    const schema = SchemaBuilder.buildZodSchema(fields)

    expect(() => schema.parse({ status: 'pending' })).not.toThrow()
    expect(() => schema.parse({ status: 'invalid' })).toThrow()
  })

  it('should strip unknown fields', () => {
    const fields: FieldConfig[] = [{ name: 'name', type: 'text', label: 'Name' }]
    const data = { name: 'John', secret: '123' }
    const stripped = SchemaBuilder.stripUnknownFields(data, fields)

    expect(stripped).toEqual({ name: 'John' })
    expect(stripped).not.toHaveProperty('secret')
  })
})
