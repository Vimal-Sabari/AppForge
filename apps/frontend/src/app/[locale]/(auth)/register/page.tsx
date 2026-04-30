'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { RegisterSchema, RegisterInput } from 'shared-types'
import { useAuthStore } from '@/lib/store/auth.store'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'

export default function RegisterPage() {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('auth')
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
        credentials: 'include',
        body: JSON.stringify(data),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Registration failed')
      }

      setUser(
        { id: json.user?.id || 'unknown', email: json.user?.email || data.email },
        json.accessToken
      )
      router.push(`/${locale}/dashboard`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    }
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#F8FAFC]">
      <div className="w-full max-w-md p-10 bg-white rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-[#E2E8F0] animate-in fade-in zoom-in duration-500">
        <h1 className="text-3xl font-extrabold mb-8 text-center text-[#0F172A] tracking-tight">
          {t('registerTitle')}
        </h1>

        {error && (
          <div className="mb-6 text-[#EF4444] text-sm font-bold p-4 bg-[#FEF2F2] rounded-[12px] border border-[#FCA5A5] flex items-center">
            <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-[#0F172A] mb-2">{t('email')}</label>
            <input
              {...register('email')}
              type="email"
              className="w-full border border-[#E2E8F0] rounded-[12px] px-4 py-3 outline-none focus:border-[#4F46E5] focus:ring-[3px] focus:ring-[rgba(79,70,229,0.1)] transition-all"
              placeholder="you@example.com"
            />
            {errors.email && (
              <span className="text-[#EF4444] text-xs font-bold mt-1 block">
                {errors.email.message}
              </span>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-[#0F172A] mb-2">{t('password')}</label>
            <input
              {...register('password')}
              type="password"
              className="w-full border border-[#E2E8F0] rounded-[12px] px-4 py-3 outline-none focus:border-[#4F46E5] focus:ring-[3px] focus:ring-[rgba(79,70,229,0.1)] transition-all"
              placeholder="••••••••"
            />
            {errors.password && (
              <span className="text-[#EF4444] text-xs font-bold mt-1 block">
                {errors.password.message}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-[#4F46E5] to-[#2563EB] text-white font-bold rounded-[12px] py-3 shadow-[0_4px_15px_rgba(79,70,229,0.3)] hover:brightness-110 hover:scale-[1.01] transition-all active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? t('registering') : t('registerButton')}
          </button>
        </form>

        <div className="mt-8 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#E2E8F0]"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-4 text-[#64748B] font-bold">Or continue with</span>
          </div>
        </div>

        <div className="mt-8">
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`}
            className="flex items-center justify-center w-full border border-[#E2E8F0] rounded-[12px] py-3 text-sm font-bold text-[#0F172A] hover:bg-[#F8FAFC] hover:border-[#CBD5E1] transition-all active:scale-95"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {t('googleSignIn')}
          </a>
        </div>

        <div className="mt-10 text-center text-sm font-medium text-[#64748B]">
          {t('haveAccount')}
          {` `}
          <a href={`/${locale}/login`} className="text-[#4F46E5] font-bold hover:underline">
            {t('loginButton')}
          </a>
        </div>
      </div>
    </div>
  )
}
