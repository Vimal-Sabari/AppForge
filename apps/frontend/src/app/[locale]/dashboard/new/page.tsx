'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { AppHeader } from '@/components/shared/AppHeader'
import { useAuthStore } from '@/lib/store/auth.store'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import dynamic from 'next/dynamic'
import { Check, ChevronRight, Play, AlertTriangle, AlertCircle, Sparkles } from 'lucide-react'
import { AppConfig } from 'shared-types'

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
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
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
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AppHeader />

      <main className="flex-grow flex flex-col max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create New App</h1>
          <p className="text-gray-500 mt-2">
            Generate a fully functional application from a JSON config.
          </p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-8 relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-gray-200 -z-10"></div>
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-blue-600 -z-10 transition-all duration-500"
            style={{ width: `${(step - 1) * 50}%` }}
          ></div>

          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${step === s ? 'border-blue-600 bg-white text-blue-600' : step > s ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 bg-white text-gray-400'} font-semibold transition-colors`}
            >
              {step > s ? <Check className="w-5 h-5" /> : s}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-grow flex flex-col overflow-hidden">
          {step === 1 && (
            <div className="flex flex-col h-[600px]">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <div className="flex space-x-4">
                  <button className="text-sm font-medium text-blue-600 border-b-2 border-blue-600 pb-1">
                    Paste JSON
                  </button>
                  <label className="text-sm font-medium text-gray-500 hover:text-gray-700 cursor-pointer pb-1">
                    Upload .json
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
                  className="text-sm text-gray-600 hover:text-gray-900 flex items-center bg-white px-3 py-1.5 rounded border border-gray-200 shadow-sm"
                >
                  <Sparkles className="w-4 h-4 mr-2 text-amber-500" />
                  Load Sample
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
                  }}
                />
              </div>
              <div className="p-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={handleValidate}
                  className="inline-flex items-center px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Validate Config
                  <ChevronRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && validationResult && (
            <div className="p-8">
              <h2 className="text-2xl font-semibold mb-6">Review Configuration</h2>

              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <div className="text-sm text-gray-500 mb-1">App Name</div>
                  <div className="text-lg font-medium">
                    {validationResult.config?.name || 'Unknown'}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <div className="text-sm text-gray-500 mb-1">Pages</div>
                  <div className="text-lg font-medium">
                    {validationResult.config?.ui?.pages?.length || 0} configured
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <div className="text-sm text-gray-500 mb-1">Tables</div>
                  <div className="text-lg font-medium">
                    {validationResult.config?.database?.tables?.length || 0} generated
                  </div>
                </div>
              </div>

              {!validationResult.valid ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h3 className="text-red-800 font-medium mb-2">Configuration Errors</h3>
                      <ul className="list-disc pl-5 space-y-1 text-sm text-red-700">
                        {validationResult.error && (
                          <li className="font-bold">{validationResult.error}</li>
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
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start">
                      <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <h3 className="text-amber-800 font-medium mb-2">Warnings (Auto-fixed)</h3>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-amber-700">
                          {validationResult.warnings.map((w, i) => (
                            <li key={i}>{w}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )
              )}

              <div className="flex justify-between mt-8">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-2 text-gray-700 bg-gray-100 font-medium rounded-md hover:bg-gray-200 transition-colors"
                >
                  Back to Editor
                </button>
                <button
                  onClick={() => createMutation.mutate(jsonInput)}
                  disabled={!validationResult.valid || createMutation.isPending}
                  className="px-6 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  {createMutation.isPending ? 'Creating...' : 'Looks good — Create App'}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">App Created Successfully!</h2>
              <p className="text-gray-500 mb-8 max-w-md">
                Your backend APIs and frontend UI have been generated and are ready to use.
              </p>

              <div className="flex space-x-4">
                <Link
                  href={`/${locale}/dashboard/${createdAppId}/settings`}
                  className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Edit Config
                </Link>
                <Link
                  href={`/${locale}/dashboard/${createdAppId}${validationResult?.config?.ui?.pages?.[0]?.path ? (validationResult.config.ui.pages[0].path.startsWith('/') ? validationResult.config.ui.pages[0].path : '/' + validationResult.config.ui.pages[0].path) : '/'}`}
                  className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors shadow-sm inline-flex items-center"
                >
                  <Play className="w-4 h-4 mr-2" fill="currentColor" />
                  Open App
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
