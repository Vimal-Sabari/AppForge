'use client'

import React from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { AppHeader } from '@/components/shared/AppHeader'
import { Plus, LayoutTemplate, Clock, ArrowRight } from 'lucide-react'
import { useAuthStore } from '@/lib/store/auth.store'
import { AppConfig } from 'shared-types'
import { useLocale } from 'next-intl'

interface AppModel {
  id: string
  name: string
  slug: string
  config: AppConfig
  createdAt: string
  updatedAt: string
}

export default function DashboardPage() {
  const { accessToken } = useAuthStore()
  const locale = useLocale()

  const { data, isLoading } = useQuery({
    queryKey: ['apps'],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/apps`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      if (!res.ok) throw new Error('Failed to fetch apps')
      const json = await res.json()
      return json.data as AppModel[]
    },
    enabled: !!accessToken,
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Your Apps</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your generated applications</p>
          </div>
          <Link
            href={`/${locale}/dashboard/new`}
            className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            New App
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm animate-pulse"
              >
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-6"></div>
                <div className="flex justify-between">
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : data && data.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.map((app) => {
              const pageCount = app.config?.ui?.pages?.length || 0
              const firstPagePath = app.config?.ui?.pages?.[0]?.path || '/'

              return (
                <div
                  key={app.id}
                  className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full"
                >
                  <div className="flex-grow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
                      {app.name}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                      Config-driven application generated with AppForge.
                    </p>

                    <div className="flex items-center space-x-4 text-xs text-gray-500 mb-6">
                      <div className="flex items-center">
                        <LayoutTemplate className="w-4 h-4 mr-1" />
                        {pageCount} page{pageCount !== 1 ? 's' : ''}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {new Date(app.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                    <Link
                      href={`/${locale}/dashboard/${app.id}/settings`}
                      className="text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors"
                    >
                      Settings
                    </Link>
                    <Link
                      href={`/${locale}/dashboard/${app.id}${firstPagePath.startsWith('/') ? firstPagePath : '/' + firstPagePath}`}
                      className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                    >
                      Open App
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-200 shadow-sm">
            <LayoutTemplate className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No apps created yet</h3>
            <p className="text-gray-500 max-w-sm mx-auto mb-6">
              Get started by creating your first config-driven application. It only takes a JSON
              snippet.
            </p>
            <Link
              href={`/${locale}/dashboard/new`}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create your first app
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
