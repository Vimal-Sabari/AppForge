'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { RegisterSchema, RegisterInput } from 'shared-types'
import { useAuthStore } from '@/lib/store/auth.store'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useLocale } from 'next-intl'

export default function RegisterPage() {
  const router = useRouter()
  const locale = useLocale()
  const { setUser } = useAuthStore()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
  })

  const onSubmit = async (data: RegisterInput) => {
    setError(null)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Registration failed')
      }

      setUser({ id: 'unknown', email: data.email }, json.accessToken)
      router.push(`/${locale}/dashboard`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    }
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Register for AppForge</h1>

        {error && <div className="mb-4 text-red-500 text-sm p-2 bg-red-50 rounded">{error}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              {...register('email')}
              type="email"
              className="w-full border rounded px-3 py-2"
              placeholder="you@example.com"
            />
            {errors.email && <span className="text-red-500 text-xs">{errors.email.message}</span>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              {...register('password')}
              type="password"
              className="w-full border rounded px-3 py-2"
              placeholder="••••••••"
            />
            {errors.password && (
              <span className="text-red-500 text-xs">{errors.password.message}</span>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white rounded py-2 hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`}
            className="inline-block w-full border border-gray-300 rounded py-2 hover:bg-gray-50"
          >
            Sign in with Google
          </a>
        </div>

        <div className="mt-4 text-center text-sm">
          Already have an account?{` `}
          <a href={`/${locale}/login`} className="text-blue-600 hover:underline">
            Login
          </a>
        </div>
      </div>
    </div>
  )
}
