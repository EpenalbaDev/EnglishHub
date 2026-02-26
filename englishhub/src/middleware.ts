import { type NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import {
  defaultLocale,
  getLocaleFromPathname,
  isLocale,
  localeCookieName,
  stripLocalePrefix,
  withLocalePath,
} from '@/i18n/routing'

function copyResponseCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie)
  })
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const localeFromPath = getLocaleFromPathname(pathname)
  const localeFromCookie = request.cookies.get(localeCookieName)?.value
  const locale = localeFromPath || (isLocale(localeFromCookie) ? localeFromCookie : defaultLocale)

  if (!localeFromPath) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = withLocalePath(pathname, locale)
    const redirectResponse = NextResponse.redirect(redirectUrl)
    redirectResponse.cookies.set(localeCookieName, locale, {
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
    })
    return redirectResponse
  }

  const normalizedPathname = stripLocalePrefix(pathname)
  const sessionResponse = await updateSession(request, {
    locale,
    pathnameForAuthCheck: normalizedPathname,
  })

  if (sessionResponse.headers.get('location')) {
    return sessionResponse
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-englishhub-locale', locale)
  const rewriteUrl = request.nextUrl.clone()
  rewriteUrl.pathname = normalizedPathname

  const rewriteResponse = NextResponse.rewrite(rewriteUrl, {
    request: {
      headers: requestHeaders,
    },
  })

  rewriteResponse.cookies.set(localeCookieName, locale, {
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
  })
  copyResponseCookies(sessionResponse, rewriteResponse)
  return rewriteResponse
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
