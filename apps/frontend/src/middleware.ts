import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // In a real app, we might want to check the token's validity,
  // but since we store access token in memory/Zustand, the server-side Next.js
  // only knows about the refreshToken cookie.
  const refreshToken = request.cookies.get('refreshToken')

  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!refreshToken) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
