'use client'

import React from 'react'
import { useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'

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
    <div className="flex items-center space-x-1 bg-[#F1F5F9] p-1 rounded-xl border border-[#E2E8F0] shadow-inner">
      <button
        onClick={() => toggleLanguage('en')}
        className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
          locale === 'en'
            ? 'bg-white text-[#4F46E5] shadow-sm'
            : 'text-[#64748B] hover:text-[#0F172A]'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => toggleLanguage('ta')}
        className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
          locale === 'ta'
            ? 'bg-white text-[#4F46E5] shadow-sm'
            : 'text-[#64748B] hover:text-[#0F172A]'
        }`}
      >
        தமிழ்
      </button>
      <button
        onClick={() => toggleLanguage('hi')}
        className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
          locale === 'hi'
            ? 'bg-white text-[#4F46E5] shadow-sm'
            : 'text-[#64748B] hover:text-[#0F172A]'
        }`}
      >
        हिंदी
      </button>
      <button
        onClick={() => toggleLanguage('ml')}
        className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
          locale === 'ml'
            ? 'bg-white text-[#4F46E5] shadow-sm'
            : 'text-[#64748B] hover:text-[#0F172A]'
        }`}
      >
        മലയാളം
      </button>
    </div>
  )
}
