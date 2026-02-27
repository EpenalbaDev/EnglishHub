import { createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
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
    const loginUrl = new URL('/student/login', request.nextUrl.origin)
    loginUrl.searchParams.set('error', 'link_expired')
    return NextResponse.redirect(loginUrl)
  }

  const { data: student } = await admin
    .from('students')
    .select('email')
    .eq('id', linkRecord.student_id)
    .single()

  const email = student?.email?.trim().toLowerCase()
  if (!email) {
    const loginUrl = new URL('/student/login', request.nextUrl.origin)
    loginUrl.searchParams.set('error', 'student_without_email')
    return NextResponse.redirect(loginUrl)
  }

  const { data: generated, error: generateError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: {
      redirectTo: `${request.nextUrl.origin}/student/dashboard`,
    },
  })

  if (generateError || !generated?.properties?.action_link) {
    const loginUrl = new URL('/student/login', request.nextUrl.origin)
    loginUrl.searchParams.set('error', 'magic_link_failed')
    return NextResponse.redirect(loginUrl)
  }

  await admin
    .from('student_access_links')
    .update({
      last_used_at: nowIso,
      use_count: linkRecord.use_count + 1,
    })
    .eq('id', linkRecord.id)

  return NextResponse.redirect(generated.properties.action_link)
}
