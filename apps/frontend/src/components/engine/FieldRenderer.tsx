import React from 'react'
import { FieldConfig } from 'shared-types'

export function FieldRenderer({
  field,
  value,
  onChange,
}: {
  field: FieldConfig
  value: unknown
  onChange?: (val: unknown) => void
}) {
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    if (!onChange) return

    const { type, value } = e.target
    if (type === 'number') {
      onChange(value === '' ? null : Number(value))
    } else {
      onChange(value)
    }
  }

  switch (field.type) {
    case 'text':
    case 'email':
    case 'date':
      return (
        <input
          type={field.type}
          value={(value as string) || ''}
          onChange={handleChange}
          className="border p-2 rounded"
          placeholder={field.label}
          required={field.required}
        />
      )
    case 'number':
      return (
        <input
          type="number"
          value={(value as number) || 0}
          onChange={handleChange}
          className="border p-2 rounded"
          placeholder={field.label}
          required={field.required}
        />
      )
    case 'boolean':
      return (
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange && onChange(e.target.checked)}
          className="mr-2"
        />
      )
    case 'textarea':
      return (
        <textarea
          value={(value as string) || ''}
          onChange={handleChange}
          className="border p-2 rounded"
          placeholder={field.label}
          required={field.required}
        />
      )
    case 'select':
      return (
        <select
          value={(value as string) || ''}
          onChange={handleChange}
          className="border p-2 rounded"
          required={field.required}
        >
          <option value="">Select...</option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )
    case 'file':
      return (
        <input
          type="file"
          onChange={(e) => onChange && onChange(e.target.files?.[0])}
          className="border p-2 rounded"
          required={field.required}
        />
      )
    default:
      return <div className="text-red-500">Unknown field type: {field.type}</div>
  }
}
