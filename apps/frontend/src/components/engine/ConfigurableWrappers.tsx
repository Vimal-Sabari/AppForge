'use client'

import React from 'react'
import { ComponentConfig, AppConfig } from 'shared-types'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FormRenderer } from './FormRenderer'
import { TableRenderer } from './TableRenderer'
import { useAuthStore } from '@/lib/store/auth.store'

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
      if (!res.ok) throw new Error('Failed to submit form')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tableData', appId, config.tableRef] })
      alert('Successfully submitted!')
    },
    onError: (err) => {
      alert(`Error: ${err.message}`)
    },
  })

  if (!table)
    return <div className="text-red-500">Table {config.tableRef} not found in config.</div>

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">{config.title || 'Form'}</h2>
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
      return res.json()
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
      if (!res.ok) throw new Error('Failed to delete')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tableData', appId, config.tableRef] })
    },
  })

  if (!table)
    return <div className="text-red-500">Table {config.tableRef} not found in config.</div>
  if (error) return <div className="text-red-500">Error loading data: {error.message}</div>

  return (
    <div className="bg-white rounded-lg">
      <TableRenderer
        tableConfig={table}
        data={data}
        isLoading={isLoading}
        actions={config.actions}
        onDelete={(id) => deleteMutation.mutate(id)}
        onAdd={() => alert('Add form would open here (use a Form component)')}
        onEdit={(row) => alert(`Edit form would open here for ${row.id}`)}
      />
    </div>
  )
}

export function ConfigurableDashboard() {
  return (
    <div className="p-4 bg-gray-50 border rounded text-gray-500">
      Dashboard layout renderer not fully implemented.
    </div>
  )
}

export function ConfigurableChart() {
  return (
    <div className="p-4 bg-gray-50 border rounded text-gray-500">
      Chart renderer not fully implemented.
    </div>
  )
}

export function ConfigurableText({ config }: { config: ComponentConfig }) {
  return <div className="prose max-w-none">{config.title}</div>
}
