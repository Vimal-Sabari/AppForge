import React from 'react'
import { AppConfig } from 'shared-types'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FileText, Menu, X } from 'lucide-react'
import { useLocale } from 'next-intl'

interface AppSidebarProps {
  appConfig: AppConfig
  appId: string
}

export function AppSidebar({ appConfig, appId }: AppSidebarProps) {
  const pathname = usePathname()
  const locale = useLocale()
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <>
      {/* Mobile Toggle */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded shadow"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 text-white transform transition-transform duration-300 ease-in-out
        md:translate-x-0 md:static md:h-screen
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
      >
        <div className="h-full flex flex-col">
          <div className="px-6 py-8 border-b border-gray-800">
            <h2 className="text-xl font-bold truncate" title={appConfig.name}>
              {appConfig.name}
            </h2>
            <p className="text-sm text-gray-400 truncate mt-1">v{appConfig.version}</p>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {appConfig.ui.pages.map((page) => {
              const href = `/${locale}/dashboard/${appId}${page.path}`
              const isActive = pathname === href

              return (
                <Link
                  key={page.id}
                  href={href}
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <FileText className="w-5 h-5 mr-3" />
                  <span className="font-medium">{page.title}</span>
                </Link>
              )
            })}
          </nav>

          <div className="px-6 py-4 border-t border-gray-800">
            <Link
              href={`/${locale}/dashboard`}
              className="flex items-center text-sm text-gray-400 hover:text-white transition-colors"
            >
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Back to Apps
            </Link>
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
