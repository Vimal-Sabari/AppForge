import React from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store/auth.store'
import { LogOut, User, Layers } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'

export function AppHeader({ appName }: { appName?: string; appId?: string }) {
  const t = useTranslations('nav')
  const locale = useLocale()
  const { logout, user } = useAuthStore()
  const [showDropdown, setShowDropdown] = React.useState(false)

  return (
    <header className="h-16 bg-white border-b border-[#E2E8F0] px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-8">
        <Link href={`/${locale}/dashboard`} className="flex items-center gap-2 group">
          <div className="w-9 h-9 bg-gradient-to-br from-[#4F46E5] to-[#2563EB] rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-[#0F172A]">AppForge</span>
        </Link>

        {appName && (
          <div className="flex items-center gap-3">
            <div className="h-6 w-px bg-[#E2E8F0]"></div>
            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#4F46E5] to-[#2563EB]">
              {appName}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 pl-2 group cursor-pointer"
          >
            <div className="text-right hidden sm:block">
              <div className="text-sm font-bold text-[#0F172A]">{user?.email?.split('@')[0]}</div>
              <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider text-left">
                {t('premium') || 'Premium'}
              </div>
            </div>
            <div className="w-10 h-10 bg-[#F1F5F9] rounded-full flex items-center justify-center border-2 border-white shadow-sm overflow-hidden group-hover:border-[#4F46E5] transition-all">
              <User className="w-6 h-6 text-[#64748B] group-hover:text-[#4F46E5] transition-colors" />
            </div>
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-3 w-48 bg-white border border-[#E2E8F0] rounded-2xl shadow-xl p-2 animate-in fade-in zoom-in-95 duration-200">
              <button
                onClick={logout}
                className="flex items-center gap-3 w-full px-4 py-3 text-[#64748B] hover:text-[#EF4444] hover:bg-red-50 rounded-xl transition-all font-semibold text-sm"
              >
                <LogOut className="w-4 h-4" />
                {t('logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
