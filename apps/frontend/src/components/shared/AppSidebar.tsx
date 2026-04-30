import React from 'react'
import { AppConfig } from 'shared-types'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FileText, Menu, X, Layers, LogOut } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useAuthStore } from '@/lib/store/auth.store'

interface AppSidebarProps {
  appConfig: AppConfig
  appId: string
}

export function AppSidebar({ appConfig, appId }: AppSidebarProps) {
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations('nav')
  const { logout } = useAuthStore()
  const [isOpen, setIsOpen] = React.useState(false)

  const navItems = [
    {
      label: t('dashboard'),
      href: `/${locale}/dashboard`,
      icon: LayoutDashboard,
    },
    ...appConfig.ui.pages.map((page) => ({
      label: page.title,
      href: `/${locale}/dashboard/${appId}/${page.path.replace(/^\/+/, '')}`,
      icon: FileText,
    })),
  ]

  return (
    <>
      {/* Mobile Toggle */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded shadow border border-gray-200"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5 text-[#4F46E5]" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-[#0F172A] text-white transform transition-transform duration-300 ease-in-out
        md:translate-x-0 md:static md:h-screen
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-white/5 flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[#4F46E5] to-[#2563EB] rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <h2 className="font-bold text-lg tracking-tight truncate" title={appConfig.name}>
              {appConfig.name}
            </h2>
          </div>

          <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-[#4F46E5] text-white shadow-lg shadow-indigo-500/20'
                      : 'text-[#64748B] hover:bg-white/5 hover:text-white'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <item.icon
                    className={`w-5 h-5 transition-colors ${
                      isActive ? 'text-white' : 'text-[#64748B] group-hover:text-white'
                    }`}
                  />
                  <span className="font-semibold text-sm">{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full shadow-glow"></div>
                  )}
                </Link>
              )
            })}
          </nav>

          <div className="p-4 border-t border-white/5 bg-[#0F172A]">
            <button
              onClick={logout}
              className="flex items-center gap-3 w-full px-4 py-3 text-[#64748B] hover:text-[#EF4444] hover:bg-red-500/5 rounded-xl transition-all duration-200 group"
            >
              <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              <span className="font-semibold text-sm">{t('logout')}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
