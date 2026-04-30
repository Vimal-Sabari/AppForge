'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { AppHeader } from '@/components/shared/AppHeader'
import { useAuthStore } from '@/lib/store/auth.store'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import dynamic from 'next/dynamic'
import { Check, ChevronRight, Play, AlertTriangle, AlertCircle, Sparkles } from 'lucide-react'
import { AppConfig } from 'shared-types'
import { useLocale, useTranslations } from 'next-intl'
import { AiConfigGenerator } from '@/components/ai/AiConfigGenerator'

const MonacoEditor = dynamic(() => import('@monaco-editor/react').then((mod) => mod.default), {
  ssr: false,
})

const SAMPLE_CONFIG = `{
  "version": "1.0",
  "name": "Employee Directory",
  "auth": {
    "enabled": true,
    "methods": ["email"],
    "userScoped": false
  },
  "ui": {
    "theme": "light",
    "pages": [
      {
        "id": "home",
        "title": "Directory",
        "path": "/home",
        "components": [
          { "id": "list", "type": "table", "tableRef": "employees" }
        ]
      }
    ]
  },
  "database": {
    "tables": [
      {
        "name": "employees",
        "fields": [
          { "name": "name", "type": "text", "required": true },
          { "name": "department", "type": "select", "options": ["Engineering", "HR", "Sales"] },
          { "name": "active", "type": "boolean" }
        ]
      }
    ]
  }
}`

export default function NewAppPage() {
  const { accessToken } = useAuthStore()
  const queryClient = useQueryClient()
  const locale = useLocale()
  const t = useTranslations('newApp')
  const [step, setStep] = useState(1)
  const [jsonInput, setJsonInput] = useState(SAMPLE_CONFIG)
  const [validationResult, setValidationResult] = useState<{
    valid: boolean
    warnings?: string[]
    config?: AppConfig
    error?: string
    message?: string
  } | null>(null)
  const [createdAppId, setCreatedAppId] = useState<string | null>(null)

  const createMutation = useMutation({
    mutationFn: async (config: string) => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/apps`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: config,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create app')
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['apps'] })
      setCreatedAppId(data.appId)
      setStep(3)
    },
  })

  const handleValidate = async () => {
    try {
      JSON.parse(jsonInput)
    } catch (e) {
      setValidationResult({
        valid: false,
        warnings: ['Invalid JSON format: ' + (e as Error).message],
      })
      setStep(2)
      return
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/apps/validate`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: jsonInput,
      })
      const data = await res.json()
      setValidationResult(data)
      setStep(2)
    } catch (e) {
      setValidationResult({ valid: false, warnings: ['Validation request failed'] })
      setStep(2)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      try {
        JSON.parse(content)
        // It's valid JSON, format it and set it
        setJsonInput(JSON.stringify(JSON.parse(content), null, 2))
      } catch (err) {
        alert('The uploaded file is not a valid JSON document.')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      <AppHeader />

      <main className="flex-grow flex flex-col max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold text-[#0F172A] tracking-tight">{t('title')}</h1>
          <p className="text-[#64748B] mt-2 text-lg">{t('subtitle')}</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-12 relative px-4">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-[#E2E8F0] -z-10 rounded-full"></div>
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-[#4F46E5] to-[#2563EB] -z-10 transition-all duration-700 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.3)]"
            style={{ width: `${(step - 1) * 50}%` }}
          ></div>

          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex items-center justify-center w-12 h-12 rounded-full border-4 transition-all duration-300 ${
                step === s
                  ? 'border-[#4F46E5] bg-white text-[#4F46E5] scale-110 shadow-lg'
                  : step > s
                    ? 'border-[#4F46E5] bg-[#4F46E5] text-white shadow-md'
                    : 'border-[#E2E8F0] bg-white text-[#94A3B8]'
              } font-bold text-lg`}
            >
              {step > s ? <Check className="w-6 h-6 stroke-[3px]" /> : s}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-[24px] border border-[#E2E8F0] shadow-[0_10px_25px_rgba(0,0,0,0.08)] flex-grow flex flex-col overflow-hidden transition-all">
          {step === 1 && (
            <div className="flex flex-col h-[650px]">
              <AiConfigGenerator onConfig={setJsonInput} />
              <div className="p-4 border-b border-[#E2E8F0] flex justify-between items-center bg-[#F8FAFC]">
                <div className="flex space-x-6 px-2">
                  <button className="text-sm font-bold text-[#4F46E5] border-b-2 border-[#4F46E5] pb-2 transition-all">
                    {t('pasteJson')}
                  </button>
                  <label className="text-sm font-bold text-[#64748B] hover:text-[#0F172A] cursor-pointer pb-2 transition-colors">
                    {t('uploadJson')}
                    <input
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
                <button
                  onClick={() => setJsonInput(SAMPLE_CONFIG)}
                  className="text-xs font-bold text-[#64748B] hover:text-[#0F172A] flex items-center bg-white px-4 py-2 rounded-[10px] border border-[#E2E8F0] shadow-sm transition-all hover:shadow-md active:scale-95"
                >
                  <Sparkles className="w-4 h-4 mr-2 text-amber-500" />
                  {t('loadSample')}
                </button>
              </div>
              <div className="flex-grow">
                <MonacoEditor
                  language="json"
                  theme="vs-light"
                  value={jsonInput}
                  onChange={(val) => setJsonInput(val || '')}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    formatOnPaste: true,
                    padding: { top: 20 },
                  }}
                />
              </div>
              <div className="p-6 border-t border-[#E2E8F0] flex justify-end bg-[#F8FAFC]">
                <button
                  onClick={handleValidate}
                  className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-[#4F46E5] to-[#2563EB] text-white font-bold rounded-[12px] shadow-[0_4px_15px_rgba(79,70,229,0.3)] hover:brightness-110 hover:scale-[1.02] transition-all active:scale-95"
                >
                  {t('validate')}
                  <ChevronRight className="w-5 h-5 ml-2" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && validationResult && (
            <div className="p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-3xl font-extrabold text-[#0F172A] mb-8">{t('reviewTitle')}</h2>

              <div className="grid grid-cols-3 gap-8 mb-10">
                <div className="bg-[#F8FAFC] p-6 rounded-[16px] border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-xs font-bold text-[#64748B] uppercase tracking-widest mb-2">
                    {t('appName')}
                  </div>
                  <div className="text-xl font-bold text-[#0F172A]">
                    {validationResult.config?.name || 'Unknown'}
                  </div>
                </div>
                <div className="bg-[#F8FAFC] p-6 rounded-[16px] border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-xs font-bold text-[#64748B] uppercase tracking-widest mb-2">
                    {t('pages')}
                  </div>
                  <div className="text-xl font-bold text-[#0F172A]">
                    {validationResult.config?.ui?.pages?.length || 0}
                  </div>
                </div>
                <div className="bg-[#F8FAFC] p-6 rounded-[16px] border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-xs font-bold text-[#64748B] uppercase tracking-widest mb-2">
                    {t('tables')}
                  </div>
                  <div className="text-xl font-bold text-[#0F172A]">
                    {validationResult.config?.database?.tables?.length || 0}
                  </div>
                </div>
              </div>

              {!validationResult.valid ? (
                <div className="bg-[#FEE2E2] border border-[#FCA5A5] rounded-[16px] p-6 mb-10">
                  <div className="flex items-start">
                    <AlertCircle className="w-6 h-6 text-[#EF4444] mt-0.5 mr-4 flex-shrink-0" />
                    <div>
                      <h3 className="text-[#991B1B] font-bold text-lg mb-2">{t('errors')}</h3>
                      <ul className="list-disc pl-5 space-y-2 text-sm font-medium text-[#B91C1C]">
                        {validationResult.error && (
                          <li className="font-bold underline">{validationResult.error}</li>
                        )}
                        {validationResult.message && (
                          <li className="font-bold">{validationResult.message}</li>
                        )}
                        {validationResult.warnings?.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                validationResult.warnings &&
                validationResult.warnings.length > 0 && (
                  <div className="bg-[#FEF9C3] border border-[#FDE047] rounded-[16px] p-6 mb-10">
                    <div className="flex items-start">
                      <AlertTriangle className="w-6 h-6 text-[#EAB308] mt-0.5 mr-4 flex-shrink-0" />
                      <div>
                        <h3 className="text-[#854D0E] font-bold text-lg mb-2">{t('warnings')}</h3>
                        <ul className="list-disc pl-5 space-y-1 text-sm font-medium text-[#A16207]">
                          {validationResult.warnings.map((w, i) => (
                            <li key={i}>{w}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )
              )}

              <div className="flex justify-between items-center mt-12">
                <button
                  onClick={() => setStep(1)}
                  className="px-8 py-3 text-[#64748B] bg-[#F1F5F9] font-bold rounded-[12px] hover:bg-[#E2E8F0] transition-all active:scale-95"
                >
                  {t('back')}
                </button>
                <button
                  onClick={() => createMutation.mutate(jsonInput)}
                  disabled={!validationResult.valid || createMutation.isPending}
                  className="px-10 py-3 bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-white font-bold rounded-[12px] shadow-[0_4px_15px_rgba(34,197,94,0.3)] hover:brightness-110 hover:scale-[1.02] disabled:opacity-50 disabled:scale-100 transition-all active:scale-95"
                >
                  {createMutation.isPending ? t('creating') : t('launch')}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('successTitle')}</h2>
              <p className="text-gray-500 mb-8 max-w-md">{t('successSubtitle')}</p>

              <div className="flex space-x-4">
                <Link
                  href={`/${locale}/dashboard/${createdAppId}/settings`}
                  className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors shadow-sm"
                >
                  {t('editConfig')}
                </Link>
                <Link
                  href={`/${locale}/dashboard/${createdAppId}${validationResult?.config?.ui?.pages?.[0]?.path ? (validationResult.config.ui.pages[0].path.startsWith('/') ? validationResult.config.ui.pages[0].path : '/' + validationResult.config.ui.pages[0].path) : '/'}`}
                  className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors shadow-sm inline-flex items-center"
                >
                  <Play className="w-4 h-4 mr-2" fill="currentColor" />
                  {t('openApp')}
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
