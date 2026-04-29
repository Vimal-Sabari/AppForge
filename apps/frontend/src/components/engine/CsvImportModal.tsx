'use client'

import React, { useState } from 'react'
import Papa from 'papaparse'
import { TableConfig } from 'shared-types'
import { X, Upload, Check, AlertCircle, ChevronRight, FileText } from 'lucide-react'
import { useAuthStore } from '@/lib/store/auth.store'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

interface CsvImportModalProps {
  tableConfig: TableConfig
  appId: string
  onClose: () => void
  onSuccess: () => void
}

export function CsvImportModal({ tableConfig, appId, onClose, onSuccess }: CsvImportModalProps) {
  const t = useTranslations('import')
  const commonT = useTranslations('common')
  const { accessToken } = useAuthStore()

  const [step, setStep] = useState(1)
  const [file, setFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<Record<string, string | number | boolean | null>[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [isImporting, setIsImporting] = useState(false)
  const [results, setResults] = useState<{
    imported: number
    skipped: number
    errors: { row: number; errors: string[] }[]
  } | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      preview: 5,
      complete: (results) => {
        setHeaders(results.meta.fields || [])
        setCsvData(results.data as Record<string, string | number | boolean | null>[])

        // Auto-mapping
        const newMapping: Record<string, string> = {}
        const fieldNames = tableConfig.fields.map((f) => f.name)

        results.meta.fields?.forEach((header) => {
          const match = fieldNames.find(
            (name) => name.toLowerCase() === header.trim().toLowerCase()
          )
          if (match) newMapping[header] = match
        })
        setMapping(newMapping)
        setStep(2)
      },
    })
  }

  const handleImport = async () => {
    if (!file) return
    setIsImporting(true)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('mapping', JSON.stringify(mapping))

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/apps/${appId}/import/${tableConfig.name}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: formData,
        }
      )

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Import failed')

      setResults(data)
      setStep(3)
      onSuccess()
      toast.success(`Successfully imported ${data.imported} records`)
    } catch (err: unknown) {
      const error = err as Error
      toast.error(error.message)
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{t('upload')}</h2>
            <p className="text-gray-500 text-sm mt-1">
              {tableConfig.displayName || tableConfig.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-8">
          {step === 1 && (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer relative">
              <input
                type="file"
                accept=".csv"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleFileChange}
              />
              <Upload className="w-16 h-16 text-blue-500 mb-4" />
              <p className="text-lg font-medium text-gray-900">{t('upload')}</p>
              <p className="text-sm text-gray-500 mt-2">Maximum file size 5MB (CSV only)</p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8">
              {/* Preview */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-600" />
                  {t('preview')}
                </h3>
                <div className="overflow-x-auto border rounded-lg shadow-sm">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-700 uppercase text-xs">
                      <tr>
                        {headers.map((h) => (
                          <th key={h} className="px-4 py-2 border-b font-semibold">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csvData.map((row, i) => (
                        <tr key={i} className="border-b hover:bg-gray-50">
                          {headers.map((h) => (
                            <td key={h} className="px-4 py-2 text-gray-600 truncate max-w-[200px]">
                              {row[h]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mapping */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <ChevronRight className="w-5 h-5 mr-2 text-blue-600" />
                  {t('mapping')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {headers.map((header) => (
                    <div
                      key={header}
                      className="flex items-center space-x-4 bg-gray-50 p-4 rounded-lg border border-gray-200"
                    >
                      <span className="flex-1 font-medium text-gray-700 truncate">{header}</span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                      <select
                        value={mapping[header] || ''}
                        onChange={(e) => setMapping({ ...mapping, [header]: e.target.value })}
                        className="flex-1 p-2 bg-white border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="">Ignore Column</option>
                        {tableConfig.fields.map((f) => (
                          <option key={f.name} value={f.name}>
                            {f.label || f.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && results && (
            <div className="flex flex-col items-center justify-center py-8 space-y-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="w-10 h-10 text-green-600" />
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900">{t('results')}</h3>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                    <p className="text-sm text-green-600 font-medium">Imported</p>
                    <p className="text-3xl font-bold text-green-700">{results.imported}</p>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                    <p className="text-sm text-amber-600 font-medium">Skipped/Errors</p>
                    <p className="text-3xl font-bold text-amber-700">{results.skipped}</p>
                  </div>
                </div>
              </div>

              {results.errors.length > 0 && (
                <div className="w-full max-w-2xl bg-red-50 rounded-xl border border-red-200 overflow-hidden">
                  <div className="p-4 bg-red-100 border-b border-red-200 flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                    <span className="font-semibold text-red-800">Errors encountered</span>
                  </div>
                  <div className="max-h-60 overflow-auto p-4 space-y-2">
                    {results.errors.map((err, i) => (
                      <div key={i} className="text-sm text-red-700">
                        <span className="font-bold">Row {err.row}:</span> {err.errors.join(', ')}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex justify-end space-x-4">
          {step !== 3 ? (
            <>
              <button
                onClick={onClose}
                className="px-6 py-2.5 text-gray-700 font-medium hover:bg-gray-200 rounded-xl transition-colors"
              >
                {commonT('cancel')}
              </button>
              {step === 2 && (
                <button
                  onClick={handleImport}
                  disabled={isImporting}
                  className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:bg-gray-400 shadow-lg shadow-blue-200 transition-all active:scale-95"
                >
                  {isImporting ? commonT('loading') : 'Start Import'}
                </button>
              )}
            </>
          ) : (
            <button
              onClick={onClose}
              className="px-8 py-2.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
