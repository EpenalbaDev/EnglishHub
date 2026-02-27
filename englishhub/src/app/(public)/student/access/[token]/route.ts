import { createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

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

  const redirectTo = `${request.nextUrl.origin}/es/student/dashboard`

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

  if (generatedLink.error || !generatedLink.data?.properties?.action_link) {
    return redirectToLoginWithError(request.nextUrl.origin, 'magic_link_failed')
  }

  await admin
    .from('student_access_links')
    .update({
      last_used_at: nowIso,
      use_count: linkRecord.use_count + 1,
    })
    .eq('id', linkRecord.id)

  const actionLink = generatedLink.data.properties.action_link
  let confirmUrl: URL | null = null

  try {
    const parsedActionLink = new URL(actionLink)
    const tokenHash = parsedActionLink.searchParams.get('token_hash')
    const type = parsedActionLink.searchParams.get('type')

    if (tokenHash && type) {
      confirmUrl = new URL('/auth/confirm', request.nextUrl.origin)
      confirmUrl.searchParams.set('token_hash', tokenHash)
      confirmUrl.searchParams.set('type', type)
      confirmUrl.searchParams.set('next', '/student/dashboard')
    }
  } catch {
    // Fallback below if action_link cannot be parsed.
  }

  return NextResponse.redirect(confirmUrl ?? actionLink)
}
