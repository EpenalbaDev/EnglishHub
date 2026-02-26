import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  Users,
  BookOpen,
  AlertCircle,
  Calendar,
  Clock,
  MapPin,
  CreditCard,
  User,
  CheckCircle,
  ClipboardList,
  ChevronRight,
} from 'lucide-react'
import { StatsCard } from '@/components/shared/StatsCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatCurrency, formatDate } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: tutor } = await supabase
    .from('tutors')
    .select('id, full_name')
    .eq('auth_id', user!.id)
    .single()

  const tutorName = tutor?.full_name?.split(' ')[0] || 'Profesor'
  const tutorId = tutor?.id

  // ---- Stats queries ----
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [studentsRes, classesMonthRes, pendingPaymentsRes, nextClassRes] = await Promise.all([
    supabase
      .from('students')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active'),
    supabase
      .from('scheduled_classes')
      .select('id', { count: 'exact', head: true })
      .gte('start_time', startOfMonth)
      .in('status', ['scheduled', 'completed']),
    supabase
      .from('payments')
      .select('amount')
      .eq('status', 'pending'),
    supabase
      .from('scheduled_classes')
      .select('*, student:students(id, full_name)')
      .gte('start_time', now.toISOString())
      .eq('status', 'scheduled')
      .order('start_time')
      .limit(1)
      .maybeSingle(),
  ])

  const totalStudents = studentsRes.count || 0
  const classesThisMonth = classesMonthRes.count || 0
  const pendingTotal = (pendingPaymentsRes.data || []).reduce((sum: number, p: { amount: number }) => sum + p.amount, 0)
  const nextClass = nextClassRes.data as { start_time: string; title: string; student?: { full_name: string } | null } | null

  const nextClassLabel = nextClass
    ? new Date(nextClass.start_time).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
    : '—'

  // ---- Upcoming classes ----
  const { data: upcomingClasses } = await supabase
    .from('scheduled_classes')
    .select('*, student:students(id, full_name)')
    .gte('start_time', now.toISOString())
    .eq('status', 'scheduled')
    .order('start_time')
    .limit(5)

  // ---- Pending payments with students ----
  const { data: pendingPayments } = await supabase
    .from('payments')
    .select('*, student:students(id, full_name, email)')
    .eq('status', 'pending')
    .order('payment_date', { ascending: true })
    .limit(5)

  // ---- Recent activity (combine recent events) ----
  const [recentStudentsRes, recentPaymentsRes, recentClassesRes, recentSubmissionsRes] = await Promise.all([
    supabase.from('students').select('id, full_name, created_at').order('created_at', { ascending: false }).limit(3),
    supabase.from('payments').select('id, amount, status, created_at, student:students(full_name)').eq('status', 'paid').order('created_at', { ascending: false }).limit(3),
    supabase.from('scheduled_classes').select('id, title, status, updated_at, student:students(full_name)').eq('status', 'completed').order('updated_at', { ascending: false }).limit(3),
    supabase.from('assignment_submissions').select('id, student_name, score, max_score, submitted_at, assignment:assignments(title)').order('submitted_at', { ascending: false }).limit(3),
  ])

  type ActivityItem = { type: string; text: string; time: string }
  const activity: ActivityItem[] = []

  ;(recentStudentsRes.data || []).forEach((s: { full_name: string; created_at: string }) => {
    activity.push({ type: 'student', text: `Nuevo estudiante: ${s.full_name}`, time: s.created_at })
  })
  ;(recentPaymentsRes.data || []).forEach((p: { amount: number; created_at: string; student: { full_name: string } | null }) => {
    activity.push({ type: 'payment', text: `Pago registrado: ${formatCurrency(p.amount)} — ${p.student?.full_name || 'Estudiante'}`, time: p.created_at })
  })
  ;(recentClassesRes.data || []).forEach((c: { title: string; updated_at: string; student: { full_name: string } | null }) => {
    activity.push({ type: 'class', text: `Clase completada: ${c.title}${c.student ? ` con ${c.student.full_name}` : ''}`, time: c.updated_at })
  })
  ;(recentSubmissionsRes.data || []).forEach((s: { student_name: string | null; score: number | null; max_score: number | null; submitted_at: string; assignment: { title: string } | null }) => {
    activity.push({ type: 'submission', text: `Tarea completada: ${s.assignment?.title || 'Tarea'} por ${s.student_name || 'Anónimo'}${s.score !== null ? ` (${s.score}/${s.max_score})` : ''}`, time: s.submitted_at })
  })

  activity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
  const recentActivity = activity.slice(0, 10)

  // Greeting
  const hour = now.getHours()
  let greeting = 'Buenos días'
  if (hour >= 12 && hour < 18) greeting = 'Buenas tardes'
  else if (hour >= 18) greeting = 'Buenas noches'

  return (
    <div className="animate-fade-in">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="font-heading text-2xl text-neutral-800 lg:text-3xl">
          {greeting}, {tutorName}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Aquí tienes un resumen de tu actividad
        </p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Estudiantes activos"
          value={totalStudents}
          icon={Users}
          color="primary"
        />
        <StatsCard
          title="Clases este mes"
          value={classesThisMonth}
          icon={BookOpen}
          color="accent"
        />
        <StatsCard
          title="Pagos pendientes"
          value={pendingTotal > 0 ? formatCurrency(pendingTotal) : '$0'}
          icon={AlertCircle}
          color="warning"
        />
        <StatsCard
          title="Próxima clase"
          value={nextClassLabel}
          icon={Calendar}
          color="info"
          trend={nextClass?.title}
        />
      </div>

      {/* Content sections */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Upcoming Classes */}
        <div className="card-base">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-neutral-800">Próximas Clases</h3>
            <Link href="/calendar" className="text-xs font-medium text-primary-600 hover:text-primary-700">
              Ver agenda <ChevronRight className="inline h-3 w-3" />
            </Link>
          </div>

          {!upcomingClasses || upcomingClasses.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="Sin clases programadas"
              description="Agenda tu primera clase para verla aquí."
            />
          ) : (
            <div className="space-y-3">
              {upcomingClasses.map((cls: { id: string; title: string; start_time: string; end_time: string; location: string | null; student: { full_name: string } | null }) => {
                const start = new Date(cls.start_time)
                const end = new Date(cls.end_time)
                const isToday = start.toDateString() === now.toDateString()

                return (
                  <Link
                    key={cls.id}
                    href="/calendar"
                    className="flex items-start gap-3 rounded-lg border border-neutral-100 p-3 transition-colors hover:bg-neutral-50"
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${isToday ? 'bg-accent-100 text-accent-700' : 'bg-primary-50 text-primary-700'}`}>
                      <Clock className="h-5 w-5" strokeWidth={1.75} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-neutral-700 truncate">{cls.title}</p>
                        {isToday && <span className="badge-warning text-[10px]">Hoy</span>}
                      </div>
                      <p className="text-xs text-neutral-500">
                        {start.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })} - {end.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                        {!isToday && ` · ${formatDate(cls.start_time)}`}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-400">
                        {cls.student && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" strokeWidth={1.75} />
                            {cls.student.full_name}
                          </span>
                        )}
                        {cls.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" strokeWidth={1.75} />
                            {cls.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Pending Payments */}
        <div className="card-base">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-neutral-800">Pagos Pendientes</h3>
            <Link href="/payments" className="text-xs font-medium text-primary-600 hover:text-primary-700">
              Ver todos <ChevronRight className="inline h-3 w-3" />
            </Link>
          </div>

          {!pendingPayments || pendingPayments.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success-light">
                <CheckCircle className="h-6 w-6 text-success" strokeWidth={1.75} />
              </div>
              <p className="mt-3 text-sm font-medium text-neutral-600">Sin pagos pendientes</p>
              <p className="mt-1 text-xs text-neutral-400">¡Todo al día!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingPayments.map((payment: { id: string; amount: number; payment_date: string; student: { id: string; full_name: string; email: string | null } | null }) => {
                const daysAgo = Math.floor((now.getTime() - new Date(payment.payment_date).getTime()) / 86400000)

                return (
                  <div
                    key={payment.id}
                    className="flex items-center gap-3 rounded-lg border border-warning-light bg-warning-light/30 p-3"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-warning-light text-warning">
                      <CreditCard className="h-5 w-5" strokeWidth={1.75} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-700 truncate">
                        {payment.student?.full_name || 'Estudiante'}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {formatCurrency(payment.amount)}
                        {daysAgo > 0 && ` · ${daysAgo} días de retraso`}
                      </p>
                    </div>
                    <Link
                      href="/payments"
                      className="shrink-0 rounded-md bg-warning px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-700"
                    >
                      Registrar
                    </Link>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-6 card-base">
        <h3 className="mb-4 text-base font-semibold text-neutral-800">Actividad Reciente</h3>

        {recentActivity.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Sin actividad reciente"
            description="Tu actividad aparecerá aquí cuando empieces a usar la plataforma."
          />
        ) : (
          <div className="space-y-3">
            {recentActivity.map((item, i) => {
              const relativeTime = getRelativeTime(item.time)
              const iconMap: Record<string, typeof Users> = {
                student: Users,
                payment: CreditCard,
                class: Calendar,
                submission: ClipboardList,
              }
              const colorMap: Record<string, string> = {
                student: 'bg-primary-50 text-primary-600',
                payment: 'bg-accent-50 text-accent-600',
                class: 'bg-success-light text-success',
                submission: 'bg-info-light text-info',
              }
              const Icon = iconMap[item.type] || BookOpen

              return (
                <div key={i} className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${colorMap[item.type] || 'bg-neutral-100 text-neutral-500'}`}>
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-neutral-600 truncate">{item.text}</p>
                  </div>
                  <span className="shrink-0 text-xs text-neutral-400">{relativeTime}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function getRelativeTime(dateStr: string): string {
  const now = Date.now()
  const diff = now - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Ahora'
  if (mins < 60) return `Hace ${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Hace ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `Hace ${days}d`
  return formatDate(dateStr)
}
