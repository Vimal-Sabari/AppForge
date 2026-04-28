import createMiddleware from 'next-intl/middleware'
import { locales } from './i18n'
import { NextRequest, NextResponse } from 'next/server'

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale: 'en',
})

export function middleware(request: NextRequest) {
  const refreshToken = request.cookies.get('refreshToken')
  const pathname = request.nextUrl.pathname

  // Protect dashboard routes
  if (pathname.includes('/dashboard')) {
    if (!refreshToken) {
      // Redirect to login with locale
      const locale = pathname.split('/')[1] || 'en'
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url))
    }
  }

  return intlMiddleware(request)
}

export const config = {
  matcher: ['/', '/(ta|en)/:path*', '/dashboard/:path*', '/login', '/register'],
}
