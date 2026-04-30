'use client'

import React, { useState } from 'react'
import { TableConfig, ComponentConfig } from 'shared-types'
import { Edit2, Trash2, Plus, ArrowUpDown, FileDown } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { sanitize } from '../../lib/sanitize'

interface TableRendererProps {
  tableConfig: TableConfig
  data: Record<string, unknown>[]
  isLoading: boolean
  onEdit?: (row: Record<string, unknown>) => void
  onDelete?: (id: string) => void
  onAdd?: () => void
  onImport?: () => void
  actions?: ComponentConfig['actions']
  sortField?: string | null
  sortDirection?: 'asc' | 'desc'
  onSort?: (field: string, direction: 'asc' | 'desc') => void
}

export function TableRenderer({
  tableConfig,
  data,
  isLoading,
  onEdit,
  onDelete,
  onAdd,
  onImport,
  actions = [],
  sortField: externalSortField,
  sortDirection: externalSortDirection,
  onSort,
}: TableRendererProps) {
  const t = useTranslations('table')
  const commonT = useTranslations('common')

  const [internalSortField, setInternalSortField] = useState<string | null>(null)
  const [internalSortDirection, setInternalSortDirection] = useState<'asc' | 'desc'>('asc')

  const sortField = externalSortField !== undefined ? externalSortField : internalSortField
  const sortDirection =
    externalSortDirection !== undefined ? externalSortDirection : internalSortDirection
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const fields =
    tableConfig.fields && tableConfig.fields.length > 0
      ? tableConfig.fields
      : data.length > 0
        ? Object.keys(data[0]).map((k) => ({ name: k, type: 'text', label: k }))
        : []

  const handleSort = (field: string) => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc'

    if (onSort) {
      onSort(field, newDirection)
    } else {
      setInternalSortField(field)
      setInternalSortDirection(newDirection)
    }
  }

  const sortedData = React.useMemo(() => {
    // If onSort is provided, we assume server-side sorting or handled externally
    if (onSort || !sortField) return data
    return [...data].sort((a, b) => {
      const aVal = a[sortField]
      const bVal = b[sortField]
      if (aVal === bVal) return 0
      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1

      const comparison = aVal < bVal ? -1 : 1
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [data, sortField, sortDirection, onSort])

  return (
    <div className="w-full bg-white rounded-[16px] shadow-[0_10px_25px_rgba(0,0,0,0.08)] border border-[#E2E8F0] overflow-hidden transition-all duration-300">
      {/* Header Area */}
      <div className="p-5 border-b border-[#E2E8F0] flex justify-between items-center bg-[#F8FAFC]">
        <h3 className="text-xl font-bold text-[#0F172A]">
          {sanitize(tableConfig.displayName || tableConfig.name)}
        </h3>
        <div className="flex items-center space-x-3">
          {actions.includes('create') && (
            <>
              <button
                onClick={onImport}
                className="flex items-center px-4 py-2 text-sm font-semibold text-[#64748B] bg-white border border-[#E2E8F0] rounded-[10px] hover:bg-[#F1F5F9] transition-all active:scale-95"
              >
                <FileDown className="w-4 h-4 mr-2" />
                Import
              </button>
              <button
                onClick={onAdd}
                className="flex items-center px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-[#4F46E5] to-[#2563EB] rounded-[12px] hover:brightness-110 transition-all shadow-[0_4px_15px_rgba(79,70,229,0.3)] active:scale-95"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('addNew')}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Table Area */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-[#64748B]">
          <thead className="text-xs text-[#0F172A] uppercase bg-[#F1F5F9] font-bold tracking-wider">
            <tr>
              {fields.map((field) => (
                <th
                  key={field.name}
                  scope="col"
                  className="px-6 py-4 cursor-pointer hover:bg-[#E2E8F0] transition-colors"
                  onClick={() => handleSort(field.name)}
                >
                  <div className="flex items-center space-x-2">
                    <span>{sanitize(field.label || field.name)}</span>
                    <ArrowUpDown className="w-3 h-3 opacity-50" />
                  </div>
                </th>
              ))}
              {(actions.includes('update') || actions.includes('delete')) && (
                <th scope="col" className="px-6 py-4 text-right">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`skeleton-${i}`} className="bg-white">
                  {fields.map((f, j) => (
                    <td key={j} className="px-6 py-4">
                      <div className="h-4 bg-[#F8FAFC] rounded-lg animate-pulse w-3/4"></div>
                    </td>
                  ))}
                  {(actions.includes('update') || actions.includes('delete')) && (
                    <td className="px-6 py-4 text-right">
                      <div className="h-8 bg-[#F8FAFC] rounded-lg animate-pulse w-8 ml-auto"></div>
                    </td>
                  )}
                </tr>
              ))
            ) : sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={
                    fields.length +
                    (actions.includes('update') || actions.includes('delete') ? 1 : 0)
                  }
                  className="px-6 py-20 text-center text-[#94A3B8]"
                >
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="w-16 h-16 bg-[#F8FAFC] rounded-full flex items-center justify-center">
                      <Plus className="w-8 h-8 opacity-20" />
                    </div>
                    <p className="font-medium">{t('empty')}</p>
                  </div>
                </td>
              </tr>
            ) : (
              sortedData.map((row, i) => (
                <tr
                  key={String(row.id || i)}
                  className={`${i % 2 === 0 ? 'bg-white' : 'bg-[#F9FAFB]'} hover:bg-[#EEF2FF] transition-colors`}
                >
                  {fields.map((field) => (
                    <td
                      key={field.name}
                      className="px-6 py-4 font-medium text-gray-700 truncate max-w-xs"
                    >
                      {row[field.name] !== null && row[field.name] !== undefined
                        ? sanitize(String(row[field.name]))
                        : '-'}
                    </td>
                  ))}
                  {(actions.includes('update') || actions.includes('delete')) && (
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex justify-end space-x-2">
                        {actions.includes('update') && (
                          <button
                            onClick={() => onEdit?.(row)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title={t('edit')}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {actions.includes('delete') && (
                          <div className="relative inline-block">
                            <button
                              onClick={() => setDeleteConfirmId(String(row.id || i))}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title={t('delete')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            {deleteConfirmId === String(row.id || i) && (
                              <div className="absolute right-0 bottom-full mb-3 w-56 bg-white border border-gray-100 rounded-2xl shadow-2xl p-4 z-20 animate-in fade-in slide-in-from-bottom-2">
                                <p className="text-xs font-bold text-gray-900 mb-3">
                                  {t('confirmDelete')}
                                </p>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => {
                                      onDelete?.(String(row.id))
                                      setDeleteConfirmId(null)
                                    }}
                                    className="flex-1 text-xs bg-red-600 text-white font-bold rounded-lg py-2 hover:bg-red-700 transition-colors"
                                  >
                                    {commonT('delete')}
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="flex-1 text-xs bg-gray-100 text-gray-700 font-bold rounded-lg py-2 hover:bg-gray-200 transition-colors"
                                  >
                                    {commonT('cancel')}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
