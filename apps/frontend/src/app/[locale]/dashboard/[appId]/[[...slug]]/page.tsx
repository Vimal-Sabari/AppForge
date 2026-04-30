'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuthStore } from '@/lib/store/auth.store'
import { parseConfig } from '@/lib/config-parser'
import { DashboardRenderer } from '@/components/engine/DashboardRenderer'
import { AppSidebar } from '@/components/shared/AppSidebar'
import { AlertCircle } from 'lucide-react'
import { useLocale } from 'next-intl'

/** Strip leading/trailing slashes for consistent comparison */
function normalizePath(p: string) {
  return p.replace(/^\/+|\/+$/g, '')
}

export default function AppDynamicPage() {
  // ── All hooks called unconditionally at the top ───────────────────────────
  const params = useParams()
  const router = useRouter()
  const locale = useLocale()
  const appId = params?.appId as string
  const slugArray = params?.slug as string[]
  // rawSlug is '' when visiting /dashboard/[appId] with no sub-path
  const rawSlug = slugArray?.join('/') || ''
  const { accessToken } = useAuthStore()

  const { data, isLoading, error } = useQuery({
    queryKey: ['appConfig', appId],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/apps/${appId}`, {
        credentials: 'include',
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      })
      if (!res.ok) throw new Error('Failed to load app configuration')
      return res.json()
    },
    enabled: !!appId,
  })

  // Parse config early (null-safe) so derived values are available before returns
  const parsed = data ? parseConfig(data.config) : null
  const config = parsed?.config ?? null
  const warnings = parsed?.warnings ?? []
  const firstPage = config?.ui?.pages?.[0] ?? null
  const normalizedSlug = normalizePath(rawSlug)

  // When config is loaded and no slug given, redirect to first page.
  // useEffect fires after render, but we handle the loading state gracefully below.
  useEffect(() => {
    if (!isLoading && !error && firstPage && !rawSlug) {
      const target = normalizePath(firstPage.path)
      router.replace(`/${locale}/dashboard/${appId}/${target}`)
    }
  }, [isLoading, error, rawSlug, firstPage, router, locale, appId])

  // ── Conditional renders (all hooks already called above) ──────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Failed to load App</h1>
        <p className="text-gray-500">{(error as Error)?.message || 'Application not found'}</p>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="p-8 text-center text-red-500">
        <h1 className="text-2xl font-bold mb-4">Invalid Configuration</h1>
        <p>The configuration for this app is corrupt or invalid.</p>
      </div>
    )
  }

  if (config.ui.pages.length === 0) {
    return (
      <div className="flex h-screen bg-gray-50">
        <AppSidebar appConfig={config} appId={appId} />
        <main className="flex-1 overflow-auto p-8">
          <div className="bg-white border rounded p-12 text-center shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">No Pages Configured</h1>
            <p className="text-gray-500">This app has no pages yet. Add one in app settings.</p>
          </div>
        </main>
      </div>
    )
  }

  // No slug yet — config just loaded, useEffect will redirect shortly.
  // Show spinner to avoid a flash of the 404 screen.
  if (!rawSlug) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  // Find the page whose path matches the current slug
  const currentPage = config.ui.pages.find((p) => normalizePath(p.path) === normalizedSlug) ?? null

  if (!currentPage) {
    return (
      <div className="flex h-screen bg-gray-50">
        <AppSidebar appConfig={config} appId={appId} />
        <main className="flex-1 overflow-auto p-8">
          <div className="bg-white border rounded p-12 text-center shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">404 - Page Not Found</h1>
            <p className="text-gray-500">
              Page &apos;{normalizedSlug}&apos; not found in configuration.
            </p>
            {firstPage && (
              <button
                onClick={() =>
                  router.push(`/${locale}/dashboard/${appId}/${normalizePath(firstPage.path)}`)
                }
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                Go to Home Page
              </button>
            )}
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
