'use client'

import { useState } from 'react'
import { Plus, DollarSign, AlertCircle, UserCheck, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { usePayments } from '@/hooks/usePayments'
import { PaymentForm, type PaymentFormData } from '@/components/payments/PaymentForm'
import { PaymentTable } from '@/components/payments/PaymentTable'
import { StatsCard } from '@/components/shared/StatsCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { TableSkeleton, CardSkeleton } from '@/components/shared/LoadingSkeleton'
import { formatCurrency } from '@/lib/utils'
import type { PaymentWithStudent } from '@/types/database'

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export default function PaymentsPage() {
  const now = new Date()
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth() + 1))
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()))
  const [formOpen, setFormOpen] = useState(false)
  const [editingPayment, setEditingPayment] = useState<PaymentWithStudent | null>(null)
  const [cancellingPayment, setCancellingPayment] = useState<PaymentWithStudent | null>(null)
  const [cancelLoading, setCancelLoading] = useState(false)

  const { payments, loading, stats, createPayment, updatePayment, cancelPayment } = usePayments({
    status: statusFilter,
    year: Number(selectedYear),
    month: Number(selectedMonth),
  })

  const handleCreate = async (data: PaymentFormData) => {
    await createPayment(data)
  }

  const handleEdit = (payment: PaymentWithStudent) => {
    setEditingPayment(payment)
    setFormOpen(true)
  }

  const handleUpdate = async (data: PaymentFormData) => {
    if (!editingPayment) return
    await updatePayment(editingPayment.id, data)
    setEditingPayment(null)
  }

  const handleCancel = async () => {
    if (!cancellingPayment) return
    setCancelLoading(true)
    try {
      await cancelPayment(cancellingPayment.id)
      setCancellingPayment(null)
    } finally {
      setCancelLoading(false)
    }
  }

  // Generate year options (current year and 2 years back)
  const yearOptions = Array.from({ length: 3 }, (_, i) => now.getFullYear() - i)

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-heading text-2xl text-neutral-800 lg:text-3xl">Pagos</h1>
        <Button
          onClick={() => { setEditingPayment(null); setFormOpen(true) }}
          className="btn-accent gap-2"
        >
          <Plus className="h-4 w-4" strokeWidth={1.75} />
          Registrar Pago
        </Button>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatsCard
            title="Cobrado este mes"
            value={formatCurrency(stats.totalMonth)}
            icon={DollarSign}
            color="primary"
          />
          <StatsCard
            title="Pagos pendientes"
            value={stats.pending}
            icon={AlertCircle}
            color="warning"
          />
          <StatsCard
            title="Estudiantes al día"
            value={stats.studentsUpToDate}
            icon={UserCheck}
            color="info"
          />
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((m, i) => (
              <SelectItem key={i} value={String(i + 1)}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {yearOptions.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="paid">Pagado</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="overdue">Vencido</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {loading ? (
        <TableSkeleton rows={5} />
      ) : payments.length === 0 ? (
        <div className="card-base">
          <EmptyState
            icon={CreditCard}
            title="Sin pagos registrados"
            description="Registra el primer pago para verlo aquí."
            actionLabel="Registrar Pago"
            onAction={() => { setEditingPayment(null); setFormOpen(true) }}
          />
        </div>
      ) : (
        <PaymentTable
          payments={payments}
          onEdit={handleEdit}
          onCancel={setCancellingPayment}
        />
      )}

      {/* Payment Form Modal */}
      <PaymentForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingPayment(null) }}
        onSubmit={editingPayment ? handleUpdate : handleCreate}
        payment={editingPayment}
      />

      {/* Cancel Confirmation */}
      <ConfirmDialog
        open={!!cancellingPayment}
        onClose={() => setCancellingPayment(null)}
        onConfirm={handleCancel}
        title="Cancelar pago"
        description={`¿Estás seguro de que quieres cancelar este pago de ${cancellingPayment ? formatCurrency(cancellingPayment.amount) : ''}?`}
        confirmLabel="Cancelar pago"
        loading={cancelLoading}
        variant="danger"
      />
    </div>
  )
}
