import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

type IncomingAnswerMap = Record<string, string>

function gradeSubmission(
  exercises: Array<{ id: string; type: string; correct_answer: unknown; points: number }>,
  answers: IncomingAnswerMap
) {
  let score = 0
  let maxScore = 0

  exercises.forEach((ex) => {
    maxScore += ex.points
    if (ex.type === 'free_text') return

    const answer = answers[ex.id]
    if (answer === undefined) return

    if (ex.type === 'fill_blank') {
      const expected = String(ex.correct_answer ?? '').trim().toLowerCase()
      if (answer.trim().toLowerCase() === expected) score += ex.points
      return
    }

    if (ex.type === 'matching') {
      try {
        const parsedAnswer = JSON.parse(answer)
        if (JSON.stringify(parsedAnswer) === JSON.stringify(ex.correct_answer)) score += ex.points
      } catch {
        // Ignore malformed answers.
      }
      return
    }

    if (String(answer) === String(ex.correct_answer)) score += ex.points
  })

  return { score, maxScore }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const token = String(body.token ?? '')
    const studentName = String(body.studentName ?? '').trim()
    const studentEmail = String(body.studentEmail ?? '').trim().toLowerCase()
    const startedAtRaw = body.startedAt ? String(body.startedAt) : null
    const answers = (body.answers ?? {}) as IncomingAnswerMap

    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 400 })
    }

    if (!studentName) {
      return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })
    }

    const serverSupabase = await createClient()
    const adminSupabase = createAdminClient()

    const { data: authData } = await serverSupabase.auth.getUser()
    const authUser = authData.user

    const { data: assignment, error: assignmentError } = await adminSupabase
      .from('assignments')
      .select('id, tutor_id, title, is_active, due_date, available_until, audience, time_limit_minutes')
      .eq('public_token', token)
      .single()

    if (assignmentError || !assignment || !assignment.is_active) {
      return NextResponse.json({ error: 'Tarea no disponible' }, { status: 404 })
    }

    const now = new Date()

    if (assignment.available_until && now > new Date(assignment.available_until)) {
      return NextResponse.json({ error: 'La tarea ya no esta disponible' }, { status: 400 })
    }

    if (assignment.due_date && now > new Date(assignment.due_date)) {
      return NextResponse.json({ error: 'La fecha limite ya vencio' }, { status: 400 })
    }

    let startedAt: Date | null = null
    if (startedAtRaw) {
      startedAt = new Date(startedAtRaw)
      if (Number.isNaN(startedAt.getTime())) {
        return NextResponse.json({ error: 'startedAt invalido' }, { status: 400 })
      }
    }

    if (assignment.time_limit_minutes) {
      if (!startedAt) {
        return NextResponse.json({ error: 'Falta marca de inicio para validar tiempo limite' }, { status: 400 })
      }
      const elapsedMs = now.getTime() - startedAt.getTime()
      if (elapsedMs > assignment.time_limit_minutes * 60 * 1000) {
        return NextResponse.json({ error: 'Se excedio el tiempo limite de la tarea' }, { status: 400 })
      }
    }

    let linkedStudent: { id: string; full_name: string } | null = null

    if (authUser) {
      const { data: byAuth } = await adminSupabase
        .from('students')
        .select('id, full_name')
        .eq('tutor_id', assignment.tutor_id)
        .eq('auth_id', authUser.id)
        .maybeSingle()
      if (byAuth) linkedStudent = byAuth
    }

    if (!linkedStudent && studentEmail) {
      const { data: byEmail } = await adminSupabase
        .from('students')
        .select('id, full_name')
        .eq('tutor_id', assignment.tutor_id)
        .ilike('email', studentEmail)
        .maybeSingle()
      if (byEmail) linkedStudent = byEmail
    }

    if (assignment.audience === 'selected_students') {
      if (!linkedStudent) {
        return NextResponse.json({ error: 'Esta tarea solo esta asignada a estudiantes especificos' }, { status: 403 })
      }

      const { data: recipient } = await adminSupabase
        .from('assignment_recipients')
        .select('assignment_id')
        .eq('assignment_id', assignment.id)
        .eq('student_id', linkedStudent.id)
        .maybeSingle()

      if (!recipient) {
        return NextResponse.json({ error: 'No estas asignado a esta tarea' }, { status: 403 })
      }
    }

    const { data: exercises } = await adminSupabase
      .from('assignment_exercises')
      .select('id, type, correct_answer, points')
      .eq('assignment_id', assignment.id)
      .order('order_index')

    const graded = gradeSubmission(exercises || [], answers)

    const { data: submission, error: submissionError } = await adminSupabase
      .from('assignment_submissions')
      .insert({
        assignment_id: assignment.id,
        student_id: linkedStudent?.id ?? null,
        student_name: linkedStudent?.full_name || studentName,
        student_email: studentEmail || null,
        answers,
        score: graded.score,
        max_score: graded.maxScore,
        is_guest_submission: !linkedStudent,
        started_at: startedAt ? startedAt.toISOString() : null,
      })
      .select('id, score, max_score, is_guest_submission')
      .single()

    if (submissionError) {
      return NextResponse.json({ error: submissionError.message }, { status: 400 })
    }

    return NextResponse.json({
      submission,
      linkedStudentName: linkedStudent?.full_name ?? null,
    })
  } catch (error) {
    console.error('Assignment submit error:', error)
    return NextResponse.json({ error: 'Error interno al enviar tarea' }, { status: 500 })
  }
}
