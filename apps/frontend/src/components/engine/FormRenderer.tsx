'use client'

import React, { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FieldConfig } from 'shared-types'

interface FormRendererProps {
  fields: FieldConfig[]
  onSubmit: (data: Record<string, unknown>) => Promise<void>
  defaultValues?: Record<string, unknown>
  isLoading?: boolean
}

export function FormRenderer({ fields, onSubmit, defaultValues, isLoading }: FormRendererProps) {
  // Dynamically build Zod schema
  const schema = useMemo(() => {
    const shape: Record<string, z.ZodTypeAny> = {}
    fields.forEach((field) => {
      let fieldSchema: z.ZodTypeAny

      switch (field.type) {
        case 'number':
          fieldSchema = z.coerce.number()
          if (field.validation?.min !== undefined)
            fieldSchema = (fieldSchema as z.ZodNumber).min(field.validation.min)
          if (field.validation?.max !== undefined)
            fieldSchema = (fieldSchema as z.ZodNumber).max(field.validation.max)
          break
        case 'boolean':
          fieldSchema = z.boolean()
          break
        case 'email':
          fieldSchema = z.string().email('Invalid email')
          break
        default:
          fieldSchema = z.string()
          if (field.validation?.pattern) {
            fieldSchema = (fieldSchema as z.ZodString).regex(
              new RegExp(field.validation.pattern),
              'Invalid format'
            )
          }
      }

      if (!field.required) {
        fieldSchema = fieldSchema.optional().or(z.literal(''))
      }

      shape[field.name] = fieldSchema
    })

    return z.object(shape)
  }, [fields])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultValues || {},
  })

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 max-w-2xl mx-auto p-4 bg-white rounded-lg shadow-sm border border-gray-100"
    >
      <div className="grid gap-4">
        {fields.map((field) => {
          const hasError = !!errors[field.name]

          let InputComponent
          switch (field.type) {
            case 'textarea':
              InputComponent = (
                <textarea
                  {...register(field.name)}
                  disabled={isLoading}
                  placeholder={field.label || field.name}
                  className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[100px] ${
                    hasError ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              )
              break
            case 'select':
              InputComponent = (
                <select
                  {...register(field.name)}
                  disabled={isLoading}
                  className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white ${
                    hasError ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select an option</option>
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              )
              break
            case 'boolean':
              InputComponent = (
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register(field.name)}
                    disabled={isLoading}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{field.label || field.name}</span>
                </label>
              )
              break
            case 'text':
            case 'email':
            case 'number':
            case 'date':
            case 'file':
              InputComponent = (
                <input
                  type={field.type === 'file' ? 'file' : field.type}
                  {...register(field.name)}
                  disabled={isLoading}
                  placeholder={field.label || field.name}
                  className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                    hasError ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              )
              break
            default:
              InputComponent = (
                <div className="relative">
                  <input
                    disabled
                    className="w-full p-2 border border-yellow-300 bg-yellow-50 rounded-md text-gray-500"
                    value="Unsupported field type"
                    readOnly
                  />
                </div>
              )
          }

          return (
            <div key={field.name} className="flex flex-col space-y-1">
              {field.type !== 'boolean' && (
                <label className="text-sm font-medium text-gray-700">
                  {field.label || field.name}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
              )}
              {InputComponent}
              {hasError && (
                <span className="text-xs text-red-500">
                  {errors[field.name]?.message as string}
                </span>
              )}
            </div>
          )
        })}
      </div>

      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Submitting...
            </>
          ) : (
            'Submit'
          )}
        </button>
      </div>
    </form>
  )
}
