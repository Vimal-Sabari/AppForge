'use client'

import { useAuthStore } from '@/lib/store/auth.store'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const { user, accessToken, clearUser } = useAuthStore()
  const router = useRouter()
  const [data, setData] = useState<unknown>(null)

  useEffect(() => {
    // If we land here from OAuth, the token might be in the URL query params
    const params = new URLSearchParams(window.location.search)
    const tokenFromUrl = params.get('token')

    // Ideally we parse the JWT to set user, but for now we just store it
    if (tokenFromUrl) {
      useAuthStore.getState().setUser({ id: 'oauth_user', email: '' }, tokenFromUrl)
      window.history.replaceState({}, document.title, '/dashboard')
    }

    const currentToken = tokenFromUrl || useAuthStore.getState().accessToken

    if (currentToken) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/protected`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      })
        .then((res) => {
          if (!res.ok) throw new Error('Unauthorized')
          return res.json()
        })
        .then((d) => setData(d))
        .catch(() => {
          clearUser()
          router.push('/login')
        })
    }
  }, [router, clearUser])

  const handleLogout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      clearUser()
      router.push('/login')
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
      {user && <p className="mb-4">Logged in as {user.email || user.id}</p>}

      <div className="p-4 bg-green-50 border border-green-200 rounded mb-4">
        <h2 className="font-semibold text-green-800">Protected Route Response:</h2>
        <pre className="text-sm text-green-700 mt-2">
          {data ? JSON.stringify(data, null, 2) : 'Loading...'}
        </pre>
      </div>

      <button
        onClick={handleLogout}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Logout
      </button>
    </div>
  )
}
