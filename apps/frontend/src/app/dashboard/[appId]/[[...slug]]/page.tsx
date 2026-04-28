'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/store/auth.store'
import { parseConfig } from '@/lib/config-parser'
import { DashboardRenderer } from '@/components/engine/DashboardRenderer'
import { AppSidebar } from '@/components/shared/AppSidebar'
import { AlertCircle } from 'lucide-react'

export default function AppDynamicPage() {
  const params = useParams()
  const appId = params.appId as string
  const slugArray = params.slug as string[]
  const slugPath = '/' + (slugArray?.join('/') || '')
  const { accessToken } = useAuthStore()

  const { data, isLoading, error } = useQuery({
    queryKey: ['appConfig', appId],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/apps/${appId}`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      })
      if (!res.ok) throw new Error('Failed to load app configuration')
      return res.json()
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Failed to load App</h1>
        <p className="text-gray-500">{error?.message || 'Application not found'}</p>
      </div>
    )
  }

  const { config, warnings } = parseConfig(data.config)

  if (!config) {
    return (
      <div className="p-8 text-center text-red-500">
        <h1 className="text-2xl font-bold mb-4">Invalid Configuration</h1>
        <p>The configuration for this app is corrupt or invalid.</p>
      </div>
    )
  }

  const currentPage =
    config.ui.pages.find((p) => p.path === slugPath) ||
    (slugPath === '/' && config.ui.pages.length > 0 ? config.ui.pages[0] : null)

  if (!currentPage) {
    return (
      <div className="flex h-screen bg-gray-50">
        <AppSidebar appConfig={config} appId={appId} />
        <main className="flex-1 overflow-auto p-8">
          <div className="bg-white border rounded p-12 text-center shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">404 - Page Not Found</h1>
            <p className="text-gray-500">Page &apos;{slugPath}&apos; not found in configuration.</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <AppSidebar appConfig={config} appId={appId} />

      <main className="flex-1 overflow-auto p-4 md:p-8 w-full">
        {process.env.NODE_ENV === 'development' && warnings.length > 0 && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm">
            <p className="font-bold mb-1">Configuration Warnings (Dev Only):</p>
            <ul className="list-disc pl-5">
              {warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        <DashboardRenderer page={currentPage} appConfig={config} appId={appId} />
      </main>
    </div>
  )
}
