import createMiddleware from 'next-intl/middleware'
import { locales } from './i18n'
import { NextRequest, NextResponse } from 'next/server'

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale: 'en',
})

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const localeMatch = pathname.match(/^\/(en|ta)/)
  const locale = localeMatch ? localeMatch[1] : 'en'

  // If accessing root or un-prefixed routes that should be localized
  if (
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/dashboard'
  ) {
    return intlMiddleware(request)
  }

  // Protect dashboard routes
  if (pathname.includes('/dashboard')) {
    const refreshToken = request.cookies.get('refreshToken')
    if (!refreshToken) {
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url))
    }
  }

  return intlMiddleware(request)
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
}
