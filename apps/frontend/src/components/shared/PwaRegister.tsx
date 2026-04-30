'use client'

import { useEffect } from 'react'

/** Registers the service worker in production-capable browsers. */
export function PwaRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((error: unknown) => {
        console.error('[PWA] Service worker registration failed', error)
      })
    }
  }, [])

  return null
}
