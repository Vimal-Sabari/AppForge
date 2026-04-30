'use client'

import React, { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FieldConfig } from 'shared-types'
import { sanitize } from '../../lib/sanitize'
import { useTranslations } from 'next-intl'

interface FormRendererProps {
  fields: FieldConfig[]
  onSubmit: (data: Record<string, unknown>) => Promise<void>
  defaultValues?: Record<string, unknown>
  isLoading?: boolean
}

export function FormRenderer({ fields, onSubmit, defaultValues, isLoading }: FormRendererProps) {
  const t = useTranslations('form')
  const commonT = useTranslations('common')
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
          if (field.required) fieldSchema = (fieldSchema as z.ZodString).min(1, 'Required')
          break
        default:
          fieldSchema = z.string()
          if (field.required) fieldSchema = (fieldSchema as z.ZodString).min(1, 'Required')
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
      className="space-y-6 max-w-2xl mx-auto p-8 bg-white rounded-[16px] shadow-[0_10px_25px_rgba(0,0,0,0.08)] border border-[#E2E8F0]"
    >
      <div className="grid gap-6">
        {fields.map((field) => {
          const hasError = !!errors[field.name]

          let InputComponent
          switch (field.type) {
            case 'textarea':
              InputComponent = (
                <textarea
                  {...register(field.name)}
                  disabled={isLoading}
                  placeholder={sanitize(field.label || field.name)}
                  className={`w-full p-3 bg-white border rounded-[10px] outline-none transition-all duration-200 min-h-[120px] focus:border-[#4F46E5] focus:ring-[3px] focus:ring-[rgba(79,70,229,0.2)] ${
                    hasError ? 'border-[#EF4444]' : 'border-[#E2E8F0]'
                  }`}
                />
              )
              break
            case 'select':
              InputComponent = (
                <select
                  {...register(field.name)}
                  disabled={isLoading}
                  className={`w-full p-3 bg-white border rounded-[10px] outline-none transition-all duration-200 focus:border-[#4F46E5] focus:ring-[3px] focus:ring-[rgba(79,70,229,0.2)] ${
                    hasError ? 'border-[#EF4444]' : 'border-[#E2E8F0]'
                  }`}
                >
                  <option value="">{t('selectOption') || 'Select an option'}</option>
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
                <label className="flex items-center space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    {...register(field.name)}
                    disabled={isLoading}
                    className="w-5 h-5 text-[#4F46E5] rounded border-[#E2E8F0] focus:ring-[#4F46E5] transition-all"
                  />
                  <span className="text-sm font-medium text-[#64748B] group-hover:text-[#0F172A] transition-colors">
                    {sanitize(field.label || field.name)}
                  </span>
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
                  placeholder={sanitize(field.label || field.name)}
                  className={`w-full p-3 bg-white border rounded-[10px] outline-none transition-all duration-200 focus:border-[#4F46E5] focus:ring-[3px] focus:ring-[rgba(79,70,229,0.2)] ${
                    hasError ? 'border-[#EF4444]' : 'border-[#E2E8F0]'
                  }`}
                />
              )
              break
            default:
              InputComponent = (
                <div className="relative">
                  <input
                    disabled
                    className="w-full p-3 border border-[#FEF9C3] bg-[#FEF9C3]/30 rounded-[10px] text-[#64748B]"
                    value={commonT('unsupported')}
                    readOnly
                  />
                </div>
              )
          }

          return (
            <div key={field.name} className="flex flex-col space-y-2">
              {field.type !== 'boolean' && (
                <label htmlFor={field.name} className="text-sm font-bold text-[#0F172A]">
                  {sanitize(field.label || field.name)}
                  {field.required && <span className="text-[#EF4444] ml-1">*</span>}
                </label>
              )}
              {React.cloneElement(InputComponent as React.ReactElement, { id: field.name })}
              {hasError && (
                <span className="text-xs font-medium text-[#EF4444] animate-in fade-in slide-in-from-top-1">
                  {errors[field.name]?.message as string}
                </span>
              )}
            </div>
          )
        })}
      </div>

      <div className="pt-6 flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="px-8 py-3 bg-gradient-to-r from-[#4F46E5] to-[#2563EB] text-white font-bold rounded-[12px] shadow-[0_4px_15px_rgba(79,70,229,0.3)] hover:brightness-110 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
              {commonT('loading')}
            </>
          ) : (
            t('submit')
          )}
        </button>
      </div>
    </form>
  )
}
