import { NextRequest, NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const tokenHash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const next = requestUrl.searchParams.get('next') ?? '/student/dashboard'

  const loginUrl = new URL('/student/login', requestUrl.origin)
  loginUrl.searchParams.set('error', 'magic_link_failed')

  if (!tokenHash || !type) {
    return NextResponse.redirect(loginUrl)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({
    type: type as EmailOtpType,
    token_hash: tokenHash,
  })

  if (error) {
    return NextResponse.redirect(loginUrl)
  }

  const nextPath = next.startsWith('/') ? next : '/student/dashboard'
  return NextResponse.redirect(new URL(nextPath, requestUrl.origin))
}
