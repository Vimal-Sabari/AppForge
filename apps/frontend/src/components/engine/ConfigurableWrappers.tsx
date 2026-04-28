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

  const table = appConfig.database.tables.find((t) => t.name === config.tableRef)

  const {
    data = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['tableData', appId, config.tableRef],
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/apps/${appId}/data/${config.tableRef}`,
        {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        }
      )
      if (!res.ok) {
        if (res.status === 404) return [] // Table might not exist yet
        throw new Error('Failed to fetch data')
      }
      const json = await res.json()
      return json.data || []
    },
    enabled: !!config.tableRef,
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/apps/${appId}/data/${config.tableRef}/${id}`,
        {
          method: 'DELETE',
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        }
      )

      checkNotificationHeader(res, 'record deletion')

      if (!res.ok) throw new Error('Failed to delete')
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
        onDelete={(id) => deleteMutation.mutate(id)}
        onAdd={() => toast.info('Form integration required')}
        onEdit={(row) => toast.info(`Editing ${row.id}`)}
        onImport={() => setIsImportModalOpen(true)}
      />

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

export function ConfigurableDashboard() {
  return (
    <div className="p-8 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 text-center">
      Dashboard layout renderer not fully implemented.
    </div>
  )
}

export function ConfigurableChart() {
  return (
    <div className="p-8 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 text-center">
      Chart renderer not fully implemented.
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
