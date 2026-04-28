'use client'

import React, { useState } from 'react'
import { TableConfig, ComponentConfig } from 'shared-types'
import { Edit2, Trash2, Plus, ArrowUpDown } from 'lucide-react'

interface TableRendererProps {
  tableConfig: TableConfig
  data: Record<string, unknown>[]
  isLoading: boolean
  onEdit?: (row: Record<string, unknown>) => void
  onDelete?: (id: string) => void
  onAdd?: () => void
  actions?: ComponentConfig['actions']
}

export function TableRenderer({
  tableConfig,
  data,
  isLoading,
  onEdit,
  onDelete,
  onAdd,
  actions = [],
}: TableRendererProps) {
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // If no fields are explicitly configured for this table view, infer from data
  // However, tableConfig.fields is always present according to our schema, so we use it.
  const fields =
    tableConfig.fields && tableConfig.fields.length > 0
      ? tableConfig.fields
      : data.length > 0
        ? Object.keys(data[0]).map((k) => ({ name: k, type: 'text', label: k }))
        : []

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedData = React.useMemo(() => {
    if (!sortField) return data
    return [...data].sort((a, b) => {
      const aVal = a[sortField]
      const bVal = b[sortField]
      if (aVal === bVal) return 0
      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1

      const comparison = aVal < bVal ? -1 : 1
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [data, sortField, sortDirection])

  return (
    <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header Area */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-800">
          {tableConfig.displayName || tableConfig.name}
        </h3>
        {actions.includes('create') && (
          <button
            onClick={onAdd}
            className="flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add New
          </button>
        )}
      </div>

      {/* Table Area */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100">
            <tr>
              {fields.map((field) => (
                <th
                  key={field.name}
                  scope="col"
                  className="px-6 py-3 cursor-pointer hover:bg-gray-200 transition-colors"
                  onClick={() => handleSort(field.name)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{field.label || field.name}</span>
                    <ArrowUpDown className="w-3 h-3 text-gray-400" />
                  </div>
                </th>
              ))}
              {(actions.includes('update') || actions.includes('delete')) && (
                <th scope="col" className="px-6 py-3 text-right">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`skeleton-${i}`} className="bg-white border-b">
                  {fields.map((f, j) => (
                    <td key={j} className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                    </td>
                  ))}
                  {(actions.includes('update') || actions.includes('delete')) && (
                    <td className="px-6 py-4 text-right">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-8 ml-auto"></div>
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
                  className="px-6 py-12 text-center text-gray-500"
                >
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                      <Plus className="w-6 h-6" />
                    </div>
                    <p>No records yet. Add your first one.</p>
                  </div>
                </td>
              </tr>
            ) : (
              sortedData.map((row, i) => (
                <tr
                  key={String(row.id || i)}
                  className="bg-white border-b hover:bg-gray-50 transition-colors"
                >
                  {fields.map((field) => (
                    <td key={field.name} className="px-6 py-4 truncate max-w-xs">
                      {row[field.name] !== null && row[field.name] !== undefined
                        ? String(row[field.name])
                        : '-'}
                    </td>
                  ))}
                  {(actions.includes('update') || actions.includes('delete')) && (
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex justify-end space-x-2">
                        {actions.includes('update') && (
                          <button
                            onClick={() => onEdit?.(row)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {actions.includes('delete') && (
                          <div className="relative inline-block">
                            <button
                              onClick={() => setDeleteConfirmId(String(row.id || i))}
                              className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            {deleteConfirmId === String(row.id || i) && (
                              <div className="absolute right-0 bottom-full mb-2 w-48 bg-white border rounded shadow-lg p-2 z-10 flex flex-col items-center justify-center space-y-2">
                                <span className="text-xs text-gray-800 font-medium">
                                  Are you sure?
                                </span>
                                <div className="flex space-x-2 w-full">
                                  <button
                                    onClick={() => {
                                      onDelete?.(String(row.id))
                                      setDeleteConfirmId(null)
                                    }}
                                    className="flex-1 text-xs bg-red-600 text-white rounded py-1 hover:bg-red-700"
                                  >
                                    Delete
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="flex-1 text-xs bg-gray-200 text-gray-800 rounded py-1 hover:bg-gray-300"
                                  >
                                    Cancel
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
