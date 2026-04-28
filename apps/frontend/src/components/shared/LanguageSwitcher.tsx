'use client'

import React from 'react'
import { useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { Globe } from 'lucide-react'

export function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const toggleLanguage = (newLocale: string) => {
    // Current pathname starts with /locale, replace it
    const segments = pathname.split('/')
    segments[1] = newLocale
    const newPath = segments.join('/')

    router.replace(newPath)
  }

  return (
    <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-xl border border-gray-200 shadow-inner">
      <button
        onClick={() => toggleLanguage('en')}
        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
          locale === 'en' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => toggleLanguage('ta')}
        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
          locale === 'ta' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        தமிழ்
      </button>
      <div className="pl-1 pr-2">
        <Globe className="w-3.5 h-3.5 text-gray-400" />
      </div>
    </div>
  )
}
