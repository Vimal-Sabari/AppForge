'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useAuthStore } from '@/lib/store/auth.store'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const locale = useLocale()
  const { isAuthenticated } = useAuthStore()

  // Wait for Zustand to rehydrate from localStorage before making auth decisions.
  // On first render the store is always in its initial (unauthenticated) state,
  // even if localStorage has a valid token. We must defer the redirect until
  // after hydration is complete.
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    // useAuthStore.persist is available when the persist middleware is active
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true)
    })

    // If already hydrated (e.g. subsequent renders), set immediately
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true)
    }

    return unsub
  }, [])

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace(`/${locale}/login`)
    }
  }, [hydrated, isAuthenticated, router, locale])

  // Show spinner while store is rehydrating
  if (!hydrated) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
