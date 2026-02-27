'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  BookOpen,
  Calendar,
  ClipboardList,
  CreditCard,
  TrendingUp,
  Clock,
  Trophy,
  Flame,
  CheckCircle,
  ExternalLink,
  Loader2,
  LogOut,
  FileText,
  User,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate, getInitials } from '@/lib/utils'
import type { Student, Payment, ScheduledClass } from '@/types/database'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

type Tab = 'progress' | 'classes' | 'assignments' | 'summaries' | 'payments'

interface StudentData {
  student: Student
  tutorName: string
  tutorAvatarUrl: string | null
  stats: {
    completedClasses: number
    completedAssignments: number
    avgScore: number
    streak: number
  }
  upcomingClasses: (ScheduledClass & { lesson?: { title: string } | null })[]
  assignments: {
    id: string
    title: string
    public_token: string
    due_date: string | null
    audience: 'all_active_students' | 'selected_students'
    time_limit_minutes: number | null
    available_until: string | null
    submission?: { score: number | null; max_score: number | null; submitted_at: string } | null
  }[]
  summaries: { id: string; share_token: string; content: string; created_at: string; lesson: { title: string } | null }[]
  payments: Payment[]
}

export default function StudentDashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<StudentData | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('progress')

  useEffect(() => {
    const fetch = async () => {
      // Check auth
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/student/login')
        return
      }

      // Find student record
      const { data: student } = await supabase
        .from('students')
        .select('*')
        .eq('auth_id', user.id)
        .single()

      if (!student) {
        const normalizedUserEmail = user.email?.trim().toLowerCase()

        // Check if this is a student who needs linking
        const { data: studentByEmail } = normalizedUserEmail
          ? await supabase
              .from('students')
              .select('*')
              .eq('email', normalizedUserEmail)
              .is('auth_id', null)
              .single()
          : { data: null }

        if (studentByEmail) {
          // Link auth_id to student
          await supabase
            .from('students')
            .update({ auth_id: user.id })
            .eq('id', studentByEmail.id)

          // Reload
          window.location.reload()
          return
        }

        setError('No se encontró tu perfil de estudiante. Contacta a tu profesor.')
        setLoading(false)
        return
      }

      // Fetch tutor name
      const { data: tutor } = await supabase
        .from('tutors')
        .select('full_name, business_name, avatar_url')
        .eq('id', student.tutor_id)
        .single()

      const tutorName = tutor?.business_name || tutor?.full_name || 'Tu profesor'

      // Completed classes
      const { count: completedClasses } = await supabase
        .from('scheduled_classes')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', student.id)
        .eq('status', 'completed')

      // Upcoming classes
      const { data: upcomingClasses } = await supabase
        .from('scheduled_classes')
        .select('*, lesson:lessons(title)')
        .eq('student_id', student.id)
        .eq('status', 'scheduled')
        .gte('start_time', new Date().toISOString())
        .order('start_time')
        .limit(10)

      // Assignments + submissions
      const [submissionsByIdRes, submissionsByEmailRes] = await Promise.all([
        supabase
          .from('assignment_submissions')
          .select('id, assignment_id, score, max_score, submitted_at')
          .eq('student_id', student.id),
        user.email
          ? supabase
              .from('assignment_submissions')
              .select('id, assignment_id, score, max_score, submitted_at')
              .is('student_id', null)
              .eq('student_email', user.email.toLowerCase())
          : Promise.resolve({ data: [] as { assignment_id: string; score: number | null; max_score: number | null; submitted_at: string }[] }),
      ])

      const submissionMap = new Map<string, { score: number | null; max_score: number | null; submitted_at: string }>()
      const allSubmissions = [
        ...(submissionsByIdRes.data || []),
        ...(submissionsByEmailRes.data || []),
      ] as { assignment_id: string; score: number | null; max_score: number | null; submitted_at: string }[]
      allSubmissions.forEach((submission) => {
        const existing = submissionMap.get(submission.assignment_id)
        if (!existing || new Date(submission.submitted_at).getTime() > new Date(existing.submitted_at).getTime()) {
          submissionMap.set(submission.assignment_id, submission)
        }
      })

      const { data: globalAssignments } = await supabase
        .from('assignments')
        .select('id, title, public_token, due_date, audience, time_limit_minutes, available_until')
        .eq('tutor_id', student.tutor_id)
        .eq('is_active', true)
        .eq('audience', 'all_active_students')
        .order('created_at', { ascending: false })

      const { data: recipientRows } = await supabase
        .from('assignment_recipients')
        .select('assignment_id')
        .eq('student_id', student.id)

      const recipientAssignmentIds = (recipientRows || []).map((row: { assignment_id: string }) => row.assignment_id)

      const { data: selectedAssignments } = recipientAssignmentIds.length > 0
        ? await supabase
            .from('assignments')
            .select('id, title, public_token, due_date, audience, time_limit_minutes, available_until')
            .in('id', recipientAssignmentIds)
            .eq('is_active', true)
            .eq('audience', 'selected_students')
            .order('created_at', { ascending: false })
        : { data: [] as {
            id: string
            title: string
            public_token: string
            due_date: string | null
            audience: 'all_active_students' | 'selected_students'
            time_limit_minutes: number | null
            available_until: string | null
          }[] }

      const mergedAssignments = [
        ...(globalAssignments || []),
        ...(selectedAssignments || []),
      ]
      const uniqueAssignments = Array.from(
        new Map(mergedAssignments.map((assignment) => [assignment.id, assignment])).values()
      )

      const assignmentsList = uniqueAssignments.map((a) => ({
        ...a,
        submission: submissionMap.get(a.id) || null,
      }))

      const completedAssignments = assignmentsList.filter(a => a.submission).length
      const avgScore = completedAssignments > 0
        ? assignmentsList
            .filter(a => a.submission?.score !== null && a.submission?.max_score)
            .reduce((sum, a) => sum + ((a.submission!.score! / a.submission!.max_score!) * 100), 0) / completedAssignments
        : 0

      // Streak: count consecutive completed classes (most recent, no gaps)
      const { data: recentClasses } = await supabase
        .from('scheduled_classes')
        .select('status')
        .eq('student_id', student.id)
        .in('status', ['completed', 'no_show', 'cancelled'])
        .order('start_time', { ascending: false })
        .limit(20)

      let streak = 0
      for (const cls of (recentClasses || []) as { status: string }[]) {
        if (cls.status === 'completed') streak++
        else break
      }

      // Summaries
      const { data: summaries } = await supabase
        .from('lesson_summaries')
        .select('id, share_token, content, created_at, lesson:lessons(title)')
        .eq('tutor_id', student.tutor_id)
        .order('created_at', { ascending: false })
        .limit(10)

      // Payments
      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .eq('student_id', student.id)
        .order('payment_date', { ascending: false })
        .limit(20)

      setData({
        student: student as Student,
        tutorName,
        tutorAvatarUrl: tutor?.avatar_url ?? null,
        stats: {
          completedClasses: completedClasses || 0,
          completedAssignments,
          avgScore: Math.round(avgScore),
          streak,
        },
        upcomingClasses: (upcomingClasses || []) as StudentData['upcomingClasses'],
        assignments: assignmentsList,
        summaries: (summaries || []) as StudentData['summaries'],
        payments: (payments || []) as Payment[],
      })
      setLoading(false)
    }
    fetch()
  }, [supabase, router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/student/login')
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
        <div className="card-base max-w-md text-center">
          <User className="mx-auto h-12 w-12 text-neutral-300" strokeWidth={1.5} />
          <h2 className="mt-4 font-heading text-xl text-neutral-700">Error</h2>
          <p className="mt-2 text-sm text-neutral-500">{error}</p>
        </div>
      </div>
    )
  }

  const tabs: { id: Tab; label: string; icon: typeof BookOpen }[] = [
    { id: 'progress', label: 'Progreso', icon: TrendingUp },
    { id: 'classes', label: 'Clases', icon: Calendar },
    { id: 'assignments', label: 'Tareas', icon: ClipboardList },
    { id: 'summaries', label: 'Resúmenes', icon: FileText },
    { id: 'payments', label: 'Pagos', icon: CreditCard },
  ]

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="border-b border-neutral-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-[960px] items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
            {getInitials(data.student.full_name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-neutral-800 truncate">{data.student.full_name}</p>
            <div className="mt-0.5 flex items-center gap-2">
              <Avatar size="sm" className="h-5 w-5">
                {data.tutorAvatarUrl && <AvatarImage src={data.tutorAvatarUrl} alt={data.tutorName} />}
                <AvatarFallback className="text-[10px]">{getInitials(data.tutorName)}</AvatarFallback>
              </Avatar>
              <p className="text-xs text-neutral-400">{data.tutorName}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-md p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
            title="Cerrar sesión"
          >
            <LogOut className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-neutral-200 bg-white px-4">
        <div className="mx-auto flex max-w-[960px] gap-1 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-3 text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <tab.icon className="h-4 w-4" strokeWidth={1.75} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-[960px] px-4 py-6">
        {activeTab === 'progress' && <ProgressSection data={data} />}
        {activeTab === 'classes' && <ClassesSection data={data} />}
        {activeTab === 'assignments' && <AssignmentsSection data={data} />}
        {activeTab === 'summaries' && <SummariesSection data={data} />}
        {activeTab === 'payments' && <PaymentsSection data={data} />}
      </div>

      <footer className="py-6 text-center text-xs text-neutral-300">
        Creado con HavenLanguage
      </footer>
    </div>
  )
}

function ProgressSection({ data }: { data: StudentData }) {
  return (
    <div className="animate-fade-in space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="card-base text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary-50">
            <CheckCircle className="h-5 w-5 text-primary-600" strokeWidth={1.75} />
          </div>
          <p className="text-2xl font-bold text-neutral-800">{data.stats.completedClasses}</p>
          <p className="text-xs text-neutral-500">Clases completadas</p>
        </div>
        <div className="card-base text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-accent-50">
            <ClipboardList className="h-5 w-5 text-accent-600" strokeWidth={1.75} />
          </div>
          <p className="text-2xl font-bold text-neutral-800">{data.stats.completedAssignments}</p>
          <p className="text-xs text-neutral-500">Tareas completadas</p>
        </div>
        <div className="card-base text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-info-light">
            <Trophy className="h-5 w-5 text-info" strokeWidth={1.75} />
          </div>
          <p className="text-2xl font-bold text-neutral-800">{data.stats.avgScore > 0 ? `${data.stats.avgScore}%` : '—'}</p>
          <p className="text-xs text-neutral-500">Score promedio</p>
        </div>
        <div className="card-base text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-warning-light">
            <Flame className="h-5 w-5 text-warning" strokeWidth={1.75} />
          </div>
          <p className="text-2xl font-bold text-neutral-800">{data.stats.streak}</p>
          <p className="text-xs text-neutral-500">Racha</p>
        </div>
      </div>

      {/* Level */}
      <div className="card-base">
        <h3 className="mb-2 font-semibold text-neutral-700">Nivel actual</h3>
        <div className="flex items-center gap-3">
          <span className="badge-info text-sm">{data.student.level?.replace('_', ' ') || 'Por definir'}</span>
          {data.student.enrollment_date && (
            <span className="text-xs text-neutral-400">
              Estudiante desde {formatDate(data.student.enrollment_date, 'long')}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function ClassesSection({ data }: { data: StudentData }) {
  return (
    <div className="animate-fade-in">
      <h3 className="mb-4 font-heading text-lg text-neutral-800">Próximas Clases</h3>
      {data.upcomingClasses.length === 0 ? (
        <div className="card-base text-center py-8">
          <Calendar className="mx-auto h-10 w-10 text-neutral-300" strokeWidth={1.5} />
          <p className="mt-3 text-sm text-neutral-500">No tienes clases programadas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.upcomingClasses.map(cls => {
            const start = new Date(cls.start_time)
            const end = new Date(cls.end_time)
            const isToday = start.toDateString() === new Date().toDateString()

            return (
              <div key={cls.id} className="card-base flex items-start gap-4">
                <div className={`flex flex-col items-center rounded-lg p-3 text-center ${isToday ? 'bg-accent-100' : 'bg-primary-50'}`}>
                  <span className="text-xs font-medium uppercase text-neutral-500">
                    {start.toLocaleDateString('es', { weekday: 'short' })}
                  </span>
                  <span className="text-xl font-bold text-neutral-800">{start.getDate()}</span>
                  <span className="text-xs text-neutral-500">
                    {start.toLocaleDateString('es', { month: 'short' })}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-neutral-700">{cls.title}</p>
                    {isToday && <span className="badge-warning text-[10px]">Hoy</span>}
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-xs text-neutral-500">
                    <Clock className="h-3 w-3" strokeWidth={1.75} />
                    {start.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })} - {end.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {cls.lesson && (
                    <p className="mt-1 text-xs text-primary-600">{cls.lesson.title}</p>
                  )}
                  {cls.location && (
                    <p className="mt-1 text-xs text-neutral-400">{cls.location}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function AssignmentsSection({ data }: { data: StudentData }) {
  return (
    <div className="animate-fade-in">
      <h3 className="mb-4 font-heading text-lg text-neutral-800">Mis Tareas</h3>
      {data.assignments.length === 0 ? (
        <div className="card-base text-center py-8">
          <ClipboardList className="mx-auto h-10 w-10 text-neutral-300" strokeWidth={1.5} />
          <p className="mt-3 text-sm text-neutral-500">No tienes tareas asignadas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.assignments.map(a => (
            <div key={a.id} className="card-base flex items-center gap-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${a.submission ? 'bg-success-light' : 'bg-warning-light'}`}>
                {a.submission ? (
                  <CheckCircle className="h-5 w-5 text-success" strokeWidth={1.75} />
                ) : (
                  <ClipboardList className="h-5 w-5 text-warning" strokeWidth={1.75} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-700 truncate">{a.title}</p>
                {a.submission ? (
                  <p className="text-xs text-success">
                    Completada · {a.submission.score !== null ? `${a.submission.score}/${a.submission.max_score} puntos` : 'Enviada'}
                  </p>
                ) : (
                  <p className="text-xs text-warning">
                    Pendiente
                    {a.due_date && ` · Fecha límite: ${formatDate(a.due_date)}`}
                  </p>
                )}
              </div>
              {!a.submission && (
                <a
                  href={`/assignment/${a.public_token}`}
                  className="shrink-0 flex items-center gap-1 rounded-md bg-primary-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-700"
                >
                  Hacer tarea
                  <ExternalLink className="h-3 w-3" strokeWidth={1.75} />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SummariesSection({ data }: { data: StudentData }) {
  return (
    <div className="animate-fade-in">
      <h3 className="mb-4 font-heading text-lg text-neutral-800">Resúmenes de Clase</h3>
      {data.summaries.length === 0 ? (
        <div className="card-base text-center py-8">
          <FileText className="mx-auto h-10 w-10 text-neutral-300" strokeWidth={1.5} />
          <p className="mt-3 text-sm text-neutral-500">No hay resúmenes disponibles</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.summaries.map(s => (
            <a
              key={s.id}
              href={`/summary/${s.share_token}`}
              className="card-base block transition-colors hover:bg-neutral-50"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50">
                  <FileText className="h-5 w-5 text-primary-600" strokeWidth={1.75} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-700">
                    {s.lesson?.title || 'Resumen de clase'}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500 line-clamp-2">{s.content}</p>
                  <p className="mt-2 text-xs text-neutral-400">{formatDate(s.created_at)}</p>
                </div>
                <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-neutral-300" strokeWidth={1.75} />
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

function PaymentsSection({ data }: { data: StudentData }) {
  const statusBadge: Record<string, string> = {
    paid: 'badge-success',
    pending: 'badge-warning',
    overdue: 'badge-error',
    cancelled: 'text-neutral-400 bg-neutral-100 rounded-full px-2.5 py-1 text-xs font-medium',
  }
  const statusLabel: Record<string, string> = {
    paid: 'Pagado',
    pending: 'Pendiente',
    overdue: 'Vencido',
    cancelled: 'Cancelado',
  }

  return (
    <div className="animate-fade-in">
      <h3 className="mb-4 font-heading text-lg text-neutral-800">Historial de Pagos</h3>
      {data.payments.length === 0 ? (
        <div className="card-base text-center py-8">
          <CreditCard className="mx-auto h-10 w-10 text-neutral-300" strokeWidth={1.5} />
          <p className="mt-3 text-sm text-neutral-500">No hay pagos registrados</p>
        </div>
      ) : (
        <div className="card-base overflow-hidden p-0">
          <table className="w-full">
            <thead>
              <tr className="bg-neutral-50 text-xs uppercase tracking-wider text-neutral-500">
                <th className="px-4 py-3 text-left">Fecha</th>
                <th className="px-4 py-3 text-left">Monto</th>
                <th className="px-4 py-3 text-left">Método</th>
                <th className="px-4 py-3 text-left">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {data.payments.map(p => (
                <tr key={p.id} className="text-sm">
                  <td className="px-4 py-3 text-neutral-700">{formatDate(p.payment_date)}</td>
                  <td className="px-4 py-3 font-medium text-neutral-800">{formatCurrency(p.amount, p.currency)}</td>
                  <td className="px-4 py-3 text-neutral-500 capitalize">{p.method || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={statusBadge[p.status]}>{statusLabel[p.status]}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
