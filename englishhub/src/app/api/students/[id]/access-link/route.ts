import { randomBytes, createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = await request.json().catch(() => ({}))
    const expiresInHoursRaw = Number(body.expiresInHours ?? 24)
    const expiresInHours = Number.isFinite(expiresInHoursRaw)
      ? Math.min(Math.max(Math.floor(expiresInHoursRaw), 1), 24 * 30)
      : 24

    const supabase = await createClient()
    const { data: authData } = await supabase.auth.getUser()
    const user = authData.user

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: tutor, error: tutorError } = await supabase
      .from('tutors')
      .select('id')
      .eq('auth_id', user.id)
      .single()

    if (tutorError || !tutor) {
      return NextResponse.json({ error: 'Tutor not found' }, { status: 404 })
    }

    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, full_name')
      .eq('id', id)
      .eq('tutor_id', tutor.id)
      .single()

    if (studentError || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const rawToken = randomBytes(32).toString('hex')
    const tokenHash = hashToken(rawToken)
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString()

    const { error: insertError } = await supabase
      .from('student_access_links')
      .insert({
        tutor_id: tutor.id,
        student_id: student.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
        created_by: user.id,
      })

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 })
    }

    const url = `${request.nextUrl.origin}/student/access/${rawToken}`

    return NextResponse.json({
      ok: true,
      url,
      expiresAt,
      studentName: student.full_name,
    })
  } catch (error) {
    console.error('Create student access link error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
