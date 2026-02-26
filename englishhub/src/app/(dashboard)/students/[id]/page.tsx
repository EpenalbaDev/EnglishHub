'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Pencil,
  CreditCard,
  Mail,
  Phone,
  Calendar,
  BookOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { createClient } from '@/lib/supabase/client'
import { cn, getInitials, formatCurrency, formatDate } from '@/lib/utils'
import { StudentForm, type StudentFormData } from '@/components/students/StudentForm'
import { PaymentForm, type PaymentFormData } from '@/components/payments/PaymentForm'
import { EmptyState } from '@/components/shared/EmptyState'
import { CardSkeleton } from '@/components/shared/LoadingSkeleton'
import type { Student, Payment } from '@/types/database'

const statusBadge: Record<Student['status'], string> = {
  active: 'badge-success',
  inactive: 'badge-error',
  trial: 'badge-warning',
}
const statusLabel: Record<Student['status'], string> = {
  active: 'Activo',
  inactive: 'Inactivo',
  trial: 'Trial',
}
const levelLabel: Record<string, string> = {
  beginner: 'Beginner',
  elementary: 'Elementary',
  intermediate: 'Intermediate',
  upper_intermediate: 'Upper Intermediate',
  advanced: 'Advanced',
}
const avatarColors: Record<Student['status'], string> = {
  active: 'bg-primary-100 text-primary-700',
  inactive: 'bg-neutral-100 text-neutral-500',
  trial: 'bg-accent-100 text-accent-700',
}
const paymentStatusBadge: Record<string, string> = {
  paid: 'badge-success',
  pending: 'badge-warning',
  overdue: 'badge-error',
  cancelled: 'badge-info',
}
const paymentStatusLabel: Record<string, string> = {
  paid: 'Pagado',
  pending: 'Pendiente',
  overdue: 'Vencido',
  cancelled: 'Cancelado',
}

export default function StudentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const studentId = params.id as string
  const defaultTab = searchParams.get('tab') || 'info'

  const [student, setStudent] = useState<Student | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [editFormOpen, setEditFormOpen] = useState(false)
  const [paymentFormOpen, setPaymentFormOpen] = useState(false)

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [studentRes, paymentsRes] = await Promise.all([
      supabase.from('students').select('*').eq('id', studentId).single(),
      supabase.from('payments').select('*').eq('student_id', studentId).order('payment_date', { ascending: false }),
    ])

    if (studentRes.data) setStudent(studentRes.data as Student)
    if (paymentsRes.data) setPayments(paymentsRes.data as Payment[])
    setLoading(false)
  }, [studentId, supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleUpdateStudent = async (data: StudentFormData) => {
    const { error } = await supabase
      .from('students')
      .update(data)
      .eq('id', studentId)

    if (error) throw new Error(error.message)
    await fetchData()
  }

  const handleCreatePayment = async (data: PaymentFormData) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: tutor } = await supabase
      .from('tutors')
      .select('id')
      .eq('auth_id', user.id)
      .single()

    if (!tutor) throw new Error('Tutor not found')

    const { error } = await supabase
      .from('payments')
      .insert({
        ...data,
        student_id: studentId,
        tutor_id: tutor.id,
      })

    if (error) throw new Error(error.message)
    await fetchData()
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    )
  }

  if (!student) {
    return (
      <div className="card-base">
        <EmptyState
          icon={BookOpen}
          title="Estudiante no encontrado"
          description="Este estudiante no existe o fue eliminado."
          actionLabel="Volver a estudiantes"
          onAction={() => router.push('/students')}
        />
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      {/* Back */}
      <Link
        href="/students"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-neutral-700"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
        Estudiantes
      </Link>

      {/* Header Card */}
      <div className="card-base mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className={cn('flex h-16 w-16 items-center justify-center rounded-full text-lg font-semibold', avatarColors[student.status])}>
              {getInitials(student.full_name)}
            </div>
            <div>
              <h1 className="font-heading text-xl text-neutral-800">{student.full_name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-neutral-500">
                {student.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" strokeWidth={1.75} />
                    {student.email}
                  </span>
                )}
                {student.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" strokeWidth={1.75} />
                    {student.phone}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" strokeWidth={1.75} />
                  {formatDate(student.enrollment_date)}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className={statusBadge[student.status]}>
                  {statusLabel[student.status]}
                </span>
                {student.level && (
                  <span className="badge-info">{levelLabel[student.level]}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setEditFormOpen(true)} variant="outline" className="btn-secondary gap-2">
              <Pencil className="h-4 w-4" strokeWidth={1.75} />
              Editar
            </Button>
            <Button onClick={() => setPaymentFormOpen(true)} className="btn-accent gap-2">
              <CreditCard className="h-4 w-4" strokeWidth={1.75} />
              Registrar Pago
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={defaultTab}>
        <TabsList>
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="payments">Pagos</TabsTrigger>
          <TabsTrigger value="progress">Progreso</TabsTrigger>
        </TabsList>

        {/* Info Tab */}
        <TabsContent value="info" className="mt-4">
          <div className="card-base">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">Tarifa mensual</p>
                <p className="mt-1 text-lg font-semibold text-neutral-800">
                  {student.monthly_rate ? formatCurrency(student.monthly_rate) : 'No definida'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">Fecha de inscripción</p>
                <p className="mt-1 text-lg text-neutral-800">{formatDate(student.enrollment_date, 'long')}</p>
              </div>
            </div>
            {student.notes && (
              <div className="mt-6 border-t border-neutral-100 pt-6">
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">Notas</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-600">{student.notes}</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="mt-4">
          {payments.length === 0 ? (
            <div className="card-base">
              <EmptyState
                icon={CreditCard}
                title="Sin pagos registrados"
                description="Registra el primer pago de este estudiante."
                actionLabel="Registrar Pago"
                onAction={() => setPaymentFormOpen(true)}
              />
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-neutral-100">
              <Table>
                <TableHeader>
                  <TableRow className="bg-neutral-50 hover:bg-neutral-50">
                    <TableHead className="text-xs uppercase tracking-wider text-neutral-500">Fecha</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-neutral-500">Monto</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-neutral-500">Período</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-neutral-500">Método</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-neutral-500">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="text-sm text-neutral-700">{formatDate(payment.payment_date)}</TableCell>
                      <TableCell className="text-sm font-medium text-neutral-800">{formatCurrency(payment.amount)}</TableCell>
                      <TableCell className="text-sm text-neutral-600">
                        {payment.period_start && payment.period_end
                          ? `${formatDate(payment.period_start)} — ${formatDate(payment.period_end)}`
                          : '—'}
                      </TableCell>
                      <TableCell className="text-sm text-neutral-600 capitalize">{payment.method || '—'}</TableCell>
                      <TableCell>
                        <span className={paymentStatusBadge[payment.status]}>
                          {paymentStatusLabel[payment.status]}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Progress Tab (placeholder) */}
        <TabsContent value="progress" className="mt-4">
          <div className="card-base">
            <EmptyState
              icon={BookOpen}
              title="Progreso del estudiante"
              description="Las tareas completadas y lecciones vistas aparecerán aquí en una próxima actualización."
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Student Form */}
      <StudentForm
        open={editFormOpen}
        onClose={() => setEditFormOpen(false)}
        onSubmit={handleUpdateStudent}
        student={student}
      />

      {/* Payment Form */}
      <PaymentForm
        open={paymentFormOpen}
        onClose={() => setPaymentFormOpen(false)}
        onSubmit={handleCreatePayment}
        preSelectedStudent={student}
      />
    </div>
  )
}
