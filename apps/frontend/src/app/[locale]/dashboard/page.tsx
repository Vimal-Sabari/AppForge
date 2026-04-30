'use client'

import React from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { AppHeader } from '@/components/shared/AppHeader'
import { Plus, LayoutTemplate, Clock, ArrowRight } from 'lucide-react'
import { useAuthStore } from '@/lib/store/auth.store'
import { AppConfig } from 'shared-types'
import { useLocale, useTranslations } from 'next-intl'

interface AppModel {
  id: string
  name: string
  slug: string
  config: AppConfig
  createdAt: string
  updatedAt: string
}

export default function DashboardPage() {
  const { accessToken, isAuthenticated } = useAuthStore()
  const locale = useLocale()
  const t = useTranslations('dashboard')

  const { data, isLoading } = useQuery({
    queryKey: ['apps'],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/apps`, {
        credentials: 'include',
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      })
      if (!res.ok) throw new Error('Failed to fetch apps')
      const json = await res.json()
      return json.data as AppModel[]
    },
    enabled: isAuthenticated,
  })

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <AppHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-extrabold text-[#0F172A] tracking-tight">{t('title')}</h1>
            <p className="text-[#64748B] mt-1 text-lg">{t('subtitle')}</p>
          </div>
          <Link
            href={`/${locale}/dashboard/new`}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#4F46E5] to-[#2563EB] text-white font-bold rounded-[12px] shadow-[0_4px_15px_rgba(79,70,229,0.3)] hover:brightness-110 hover:scale-[1.02] transition-all active:scale-95"
          >
            <Plus className="w-5 h-5 mr-2" />
            {t('newApp')}
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-[24px] border border-[#E2E8F0] p-8 shadow-sm animate-pulse"
              >
                <div className="h-7 bg-[#F1F5F9] rounded-[8px] w-1/2 mb-6"></div>
                <div className="h-4 bg-[#F1F5F9] rounded-[8px] w-full mb-3"></div>
                <div className="h-4 bg-[#F1F5F9] rounded-[8px] w-3/4 mb-8"></div>
                <div className="flex justify-between pt-6 border-t border-[#F1F5F9]">
                  <div className="h-5 bg-[#F1F5F9] rounded-[8px] w-1/4"></div>
                  <div className="h-5 bg-[#F1F5F9] rounded-[8px] w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : data && data.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {data.map((app) => {
              const pageCount = app.config?.ui?.pages?.length || 0
              const firstPagePath = (app.config?.ui?.pages?.[0]?.path || '').replace(/^\/+/, '')

              return (
                <div
                  key={app.id}
                  className="group bg-white rounded-[24px] border border-[#E2E8F0] p-8 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
                >
                  <div className="flex-grow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-[#EEF2FF] rounded-2xl flex items-center justify-center text-[#4F46E5] group-hover:bg-[#4F46E5] group-hover:text-white transition-colors">
                        <LayoutTemplate className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest bg-[#F1F5F9] px-2 py-1 rounded-md">
                        {t('active')}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-[#0F172A] mb-3 truncate group-hover:text-[#4F46E5] transition-colors">
                      {app.name}
                    </h3>
                    <p className="text-[#64748B] text-sm line-clamp-2 mb-6 leading-relaxed">
                      {t('description')}
                    </p>

                    <div className="flex items-center space-x-6 text-xs font-bold text-[#94A3B8] mb-8">
                      <div className="flex items-center">
                        <LayoutTemplate className="w-4 h-4 mr-2" />
                        {pageCount} {pageCount !== 1 ? t('pages') : t('page')}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        {new Date(app.createdAt)
                          .toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                          .toUpperCase()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-6 border-t border-[#F1F5F9]">
                    <Link
                      href={`/${locale}/dashboard/${app.id}/settings`}
                      className="text-xs font-bold text-[#64748B] hover:text-[#0F172A] uppercase tracking-widest transition-colors"
                    >
                      {t('configure')}
                    </Link>
                    <Link
                      href={`/${locale}/dashboard/${app.id}/${firstPagePath}`}
                      className="inline-flex items-center text-xs font-bold text-[#4F46E5] hover:text-[#2563EB] uppercase tracking-widest transition-all group/btn"
                    >
                      {t('launch')}
                      <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-[32px] border border-[#E2E8F0] shadow-sm">
            <div className="w-20 h-20 bg-[#F1F5F9] rounded-full flex items-center justify-center mx-auto mb-8">
              <LayoutTemplate className="h-10 w-10 text-[#94A3B8]" />
            </div>
            <h3 className="text-2xl font-bold text-[#0F172A] mb-3">{t('noAppsTitle')}</h3>
            <p className="text-[#64748B] max-w-sm mx-auto mb-10 leading-relaxed font-medium">
              {t('noAppsSubtitle')}
            </p>
            <Link
              href={`/${locale}/dashboard/new`}
              className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-[#4F46E5] to-[#2563EB] text-white font-bold rounded-[12px] shadow-[0_4px_15px_rgba(79,70,229,0.3)] hover:brightness-110 hover:scale-[1.02] transition-all active:scale-95"
            >
              <Plus className="w-5 h-5 mr-2" />
              {t('buildFirst')}
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
