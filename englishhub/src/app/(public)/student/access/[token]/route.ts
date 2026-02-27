import { createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'
import type { EmailOtpType } from '@supabase/supabase-js'

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

function redirectToLoginWithError(origin: string, errorCode: string) {
  const loginUrl = new URL('/student/login', origin)
  loginUrl.searchParams.set('error', errorCode)
  return NextResponse.redirect(loginUrl)
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params
  const tokenHash = hashToken(token)
  const nowIso = new Date().toISOString()
  const admin = createAdminClient()

  const { data: linkRecord, error: linkError } = await admin
    .from('student_access_links')
    .select('id, student_id, expires_at, revoked_at, use_count')
    .eq('token_hash', tokenHash)
    .is('revoked_at', null)
    .gt('expires_at', nowIso)
    .single()

  if (linkError || !linkRecord) {
    return redirectToLoginWithError(request.nextUrl.origin, 'link_expired')
  }

  const { data: student } = await admin
    .from('students')
    .select('email')
    .eq('id', linkRecord.student_id)
    .single()

  const email = student?.email?.trim().toLowerCase()
  if (!email) {
    return redirectToLoginWithError(request.nextUrl.origin, 'student_without_email')
  }

  const redirectTo = `${request.nextUrl.origin}/student/dashboard`

  let generatedLink = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo },
  })

  // If user does not exist in auth yet, create it and retry.
  if (generatedLink.error) {
    const err = generatedLink.error.message.toLowerCase()
    if (err.includes('user not found') || err.includes('email not found')) {
      const created = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          role: 'student',
        },
      })

      if (created.error && !created.error.message.toLowerCase().includes('already')) {
        return redirectToLoginWithError(request.nextUrl.origin, 'magic_link_failed')
      }

      generatedLink = await admin.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: { redirectTo },
      })
    }
  }

  if (generatedLink.error || !generatedLink.data?.properties) {
    return redirectToLoginWithError(request.nextUrl.origin, 'magic_link_failed')
  }

  // Use hashed_token and verification_type directly from the response properties.
  // Parsing the action_link URL is fragile since the param name varies across
  // Supabase versions (token vs token_hash).
  const otpTokenHash = generatedLink.data.properties.hashed_token
  const otpType = (generatedLink.data.properties.verification_type || 'magiclink') as EmailOtpType

  if (!otpTokenHash) {
    return redirectToLoginWithError(request.nextUrl.origin, 'magic_link_failed')
  }

  // Verify the OTP directly and set session cookies on the redirect response.
  // This avoids the multi-hop redirect chain that loses cookies.
  const dashboardUrl = new URL('/student/dashboard', request.nextUrl.origin)
  const response = NextResponse.redirect(dashboardUrl)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { error: verifyError } = await supabase.auth.verifyOtp({
    type: otpType,
    token_hash: otpTokenHash,
  })

  if (verifyError) {
    return redirectToLoginWithError(request.nextUrl.origin, 'verify_failed')
  }

  // Update access link usage stats
  await admin
    .from('student_access_links')
    .update({
      last_used_at: nowIso,
      use_count: linkRecord.use_count + 1,
    })
    .eq('id', linkRecord.id)

  return response
}
