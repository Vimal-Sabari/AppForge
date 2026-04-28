import React from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store/auth.store'
import { LayoutDashboard, Settings, LogOut, User } from 'lucide-react'
import { LanguageSwitcher } from './LanguageSwitcher'
import { useTranslations, useLocale } from 'next-intl'

export function AppHeader({ appName, appId }: { appName?: string; appId?: string }) {
  const t = useTranslations('nav')
  const locale = useLocale()
  const { logout } = useAuthStore()
  const [showDropdown, setShowDropdown] = React.useState(false)

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-6">
            <Link
              href={`/${locale}/dashboard`}
              className="flex items-center text-gray-500 hover:text-blue-600 transition-colors group"
            >
              <div className="p-2 bg-gray-50 group-hover:bg-blue-50 rounded-lg transition-colors">
                <LayoutDashboard className="w-5 h-5" />
              </div>
              <span className="font-bold ml-3 hidden sm:inline">{t('dashboard')}</span>
            </Link>

            {appName && (
              <div className="flex items-center space-x-3">
                <span className="text-gray-300 font-light">|</span>
                <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                  {appName}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-6">
            <LanguageSwitcher />

            {appId && (
              <Link
                href={`/${locale}/dashboard/${appId}/settings`}
                className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                title={t('settings')}
              >
                <Settings className="w-5 h-5" />
              </Link>
            )}

            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 hover:from-blue-100 hover:to-indigo-100 transition-all border border-blue-100/50 shadow-sm"
              >
                <User className="w-5 h-5" />
              </button>

              {showDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)}></div>
                  <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl py-2 z-20 border border-gray-100 animate-in fade-in zoom-in-95 duration-100">
                    <button
                      onClick={() => {
                        logout()
                        window.location.href = `/${locale}/login`
                      }}
                      className="block w-full text-left px-4 py-3 text-sm text-red-600 font-bold hover:bg-red-50 flex items-center transition-colors"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      {t('logout')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
