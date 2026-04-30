'use client'

import React, { useState } from 'react'
import { ComponentConfig, AppConfig } from 'shared-types'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FormRenderer } from './FormRenderer'
import { TableRenderer } from './TableRenderer'
import { CsvImportModal } from './CsvImportModal'
import { useAuthStore } from '@/lib/store/auth.store'
import { toast } from 'sonner'

// Helper to check for notification header
const checkNotificationHeader = (res: Response, type: string) => {
  if (res.headers.get('X-Notification-Sent') === 'true') {
    toast.info(`Email notification sent for ${type}`, {
      description: 'The configured automation was triggered successfully.',
    })
  }
}

// Wrapper for Form to handle API calls
export function ConfigurableForm({
  config,
  appConfig,
  appId,
}: {
  config: ComponentConfig
  appConfig: AppConfig
  appId: string
}) {
  const { accessToken } = useAuthStore()
  const queryClient = useQueryClient()
  const table = appConfig.database.tables.find((t) => t.name === config.tableRef)
  const fields = table?.fields.filter((f) => !config.fields || config.fields.includes(f.name)) || []

  const mutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/apps/${appId}/data/${config.tableRef}`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify(data),
        }
      )

      checkNotificationHeader(res, 'record creation')

      if (!res.ok) throw new Error('Failed to submit form')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tableData', appId, config.tableRef] })
      toast.success('Successfully submitted!')
    },
    onError: (err) => {
      toast.error(`Error: ${err.message}`)
    },
  })

  if (!table)
    return <div className="text-red-500">Table {config.tableRef} not found in config.</div>

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">{config.title || 'Form'}</h2>
      <FormRenderer
        fields={fields}
        onSubmit={async (data) => {
          await mutation.mutateAsync(data)
        }}
        isLoading={mutation.isPending}
      />
    </div>
  )
}

// Modal for adding/editing records
function RecordFormModal({
  fields,
  onSubmit,
  onClose,
  defaultValues,
  isLoading,
  title,
}: {
  fields: FieldConfig[]
  onSubmit: (data: Record<string, unknown>) => Promise<void>
  onClose: () => void
  defaultValues?: Record<string, unknown>
  isLoading: boolean
  title: string
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <FormRenderer
            fields={fields}
            onSubmit={onSubmit}
            defaultValues={defaultValues}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  )
}

// Wrapper for Table to handle API calls
export function ConfigurableTable({
  config,
  appConfig,
  appId,
}: {
  config: ComponentConfig
  appConfig: AppConfig
  appId: string
}) {
  const { accessToken } = useAuthStore()
  const queryClient = useQueryClient()
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<Record<string, unknown> | null>(null)
  const [isAddingRecord, setIsAddingRecord] = useState(false)

  const table = appConfig.database.tables.find((t) => t.name === config.tableRef)
  const fields = table?.fields.filter((f) => !config.fields || config.fields.includes(f.name)) || []

  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const {
    data = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['tableData', appId, config.tableRef, sortField, sortDirection],
    queryFn: async () => {
      const url = new URL(
        `${process.env.NEXT_PUBLIC_API_URL}/api/apps/${appId}/data/${config.tableRef}`
      )
      if (sortField) {
        url.searchParams.append('sortBy', sortField)
        url.searchParams.append('sortDir', sortDirection)
      }

      const res = await fetch(url.toString(), {
        credentials: 'include',
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      })
      if (!res.ok) {
        if (res.status === 404) return [] // Table might not exist yet
        throw new Error('Failed to fetch data')
      }
      const json = await res.json()
      return json.data || []
    },
    enabled: !!config.tableRef,
  })

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/apps/${appId}/data/${config.tableRef}`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify(data),
        }
      )
      checkNotificationHeader(res, 'record creation')
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.message || 'Failed to create record')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tableData', appId, config.tableRef] })
      toast.success('Successfully created!')
      setIsAddingRecord(false)
    },
    onError: (err) => toast.error(`Error: ${err.message}`),
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/apps/${appId}/data/${config.tableRef}/${id}`,
        {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify(data),
        }
      )
      checkNotificationHeader(res, 'record update')
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.message || 'Failed to update record')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tableData', appId, config.tableRef] })
      toast.success('Successfully updated!')
      setEditingRecord(null)
    },
    onError: (err) => toast.error(`Error: ${err.message}`),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/apps/${appId}/data/${config.tableRef}/${id}`,
        {
          method: 'DELETE',
          credentials: 'include',
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        }
      )

      checkNotificationHeader(res, 'record deletion')

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.message || 'Failed to delete')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tableData', appId, config.tableRef] })
      toast.success('Record deleted')
    },
  })

  if (!table)
    return <div className="text-red-500">Table {config.tableRef} not found in config.</div>
  if (error) return <div className="text-red-500">Error loading data: {error.message}</div>

  return (
    <div className="bg-white rounded-2xl">
      <TableRenderer
        tableConfig={table}
        data={data}
        isLoading={isLoading}
        actions={config.actions}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={(field, dir) => {
          setSortField(field)
          setSortDirection(dir)
        }}
        onDelete={(id) => deleteMutation.mutate(id)}
        onAdd={() => setIsAddingRecord(true)}
        onEdit={(row) => setEditingRecord(row)}
        onImport={() => setIsImportModalOpen(true)}
      />

      {isAddingRecord && (
        <RecordFormModal
          fields={fields}
          title={`Add ${table.displayName || table.name}`}
          isLoading={createMutation.isPending}
          onClose={() => setIsAddingRecord(false)}
          onSubmit={async (data) => {
            await createMutation.mutateAsync(data)
          }}
        />
      )}

      {editingRecord && (
        <RecordFormModal
          fields={fields}
          title={`Edit ${table.displayName || table.name}`}
          isLoading={updateMutation.isPending}
          defaultValues={editingRecord}
          onClose={() => setEditingRecord(null)}
          onSubmit={async (data) => {
            await updateMutation.mutateAsync({ id: String(editingRecord.id), data })
          }}
        />
      )}

      {isImportModalOpen && (
        <CsvImportModal
          tableConfig={table}
          appId={appId}
          onClose={() => setIsImportModalOpen(false)}
          onSuccess={() =>
            queryClient.invalidateQueries({ queryKey: ['tableData', appId, config.tableRef] })
          }
        />
      )}
    </div>
  )
}

export function ConfigurableDashboard({
  config,
  appId,
}: {
  config: ComponentConfig
  appId: string
}) {
  const { accessToken } = useAuthStore()
  const { data = [], isLoading } = useQuery({
    queryKey: ['tableData', appId, config.tableRef],
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/apps/${appId}/data/${config.tableRef}`,
        {
          credentials: 'include',
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        }
      )
      if (!res.ok) return []
      const json = await res.json()
      return json.data || []
    },
    enabled: !!config.tableRef,
  })

  return (
    <div className="p-8 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center min-h-[200px]">
      <div className="text-4xl font-black text-[#4F46E5] mb-2">
        {isLoading ? '...' : data.length}
      </div>
      <div className="text-sm font-bold text-[#64748B] uppercase tracking-widest">
        Total {config.tableRef || 'Records'}
      </div>
    </div>
  )
}

export function ConfigurableChart({ config, appId }: { config: ComponentConfig; appId: string }) {
  const { accessToken } = useAuthStore()
  const { data = [], isLoading } = useQuery({
    queryKey: ['tableData', appId, config.tableRef],
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/apps/${appId}/data/${config.tableRef}`,
        {
          credentials: 'include',
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        }
      )
      if (!res.ok) return []
      const json = await res.json()
      return json.data || []
    },
    enabled: !!config.tableRef,
  })

  const chartData = data.slice(0, 5) // Just show first 5 for the simple bar chart

  return (
    <div className="p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
      <h3 className="text-sm font-bold text-[#0F172A] mb-6 uppercase tracking-wider">
        {config.title || 'Chart'}
      </h3>
      {isLoading ? (
        <div className="h-40 bg-gray-50 animate-pulse rounded-lg" />
      ) : (
        <div className="flex items-end space-x-2 h-40">
          {chartData.map((item: Record<string, unknown>, i: number) => {
            const val = Number(item[config.chartConfig?.yField || 'id']) || 10
            const label = String(item[config.chartConfig?.xField || 'name'] || i)
            return (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-gradient-to-t from-[#4F46E5] to-[#818CF8] rounded-t-lg transition-all duration-500"
                  style={{ height: `${Math.min(100, (val / 100) * 100)}%` }}
                />
                <div className="text-[10px] text-[#64748B] mt-2 truncate w-full text-center">
                  {label}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function ConfigurableText({ config }: { config: ComponentConfig }) {
  return (
    <div className="prose prose-blue max-w-none bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
      {config.title}
    </div>
  )
}
