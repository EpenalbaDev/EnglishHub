import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { AppLocale } from '@/i18n/routing'
import { withLocalePath } from '@/i18n/routing'

interface UpdateSessionOptions {
  locale: AppLocale
  pathnameForAuthCheck: string
}

function copyResponseCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie)
  })
}

export async function updateSession(request: NextRequest, options: UpdateSessionOptions) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Protect dashboard routes
  if (
    !user &&
    (
      options.pathnameForAuthCheck === '/' ||
      options.pathnameForAuthCheck.match(/^\/(students|lessons|assignments|payments|calendar|settings)(\/.*)?$/)
    )
  ) {
    const url = request.nextUrl.clone()
    url.pathname = withLocalePath('/login', options.locale)
    const redirectResponse = NextResponse.redirect(url)
    copyResponseCookies(supabaseResponse, redirectResponse)
    return redirectResponse
  }

  return supabaseResponse
}
