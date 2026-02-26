'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import type { Student, Payment } from '@/types/database'

const METHODS = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'transfer', label: 'Transferencia' },
  { value: 'yappy', label: 'Yappy' },
  { value: 'nequi', label: 'Nequi' },
  { value: 'card', label: 'Tarjeta' },
  { value: 'other', label: 'Otro' },
]

const STATUSES = [
  { value: 'paid', label: 'Pagado' },
  { value: 'pending', label: 'Pendiente' },
]

interface PaymentFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: PaymentFormData) => Promise<void>
  payment?: Payment | null
  preSelectedStudent?: Student | null
}

export interface PaymentFormData {
  student_id: string
  amount: number
  currency: string
  payment_date: string
  period_start: string | null
  period_end: string | null
  method: Payment['method']
  status: Payment['status']
  notes: string | null
}

export function PaymentForm({ open, onClose, onSubmit, payment, preSelectedStudent }: PaymentFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [students, setStudents] = useState<Pick<Student, 'id' | 'full_name' | 'monthly_rate'>[]>([])
  const [formData, setFormData] = useState<PaymentFormData>({
    student_id: '',
    amount: 0,
    currency: 'USD',
    payment_date: new Date().toISOString().split('T')[0],
    period_start: null,
    period_end: null,
    method: null,
    status: 'paid',
    notes: null,
  })

  const supabase = createClient()

  // Fetch students for selector
  useEffect(() => {
    if (!open) return
    const fetchStudents = async () => {
      const { data } = await supabase
        .from('students')
        .select('id, full_name, monthly_rate')
        .order('full_name')
      if (data) setStudents(data)
    }
    fetchStudents()
  }, [open, supabase])

  // Reset form on open
  useEffect(() => {
    if (payment) {
      setFormData({
        student_id: payment.student_id,
        amount: payment.amount,
        currency: payment.currency,
        payment_date: payment.payment_date,
        period_start: payment.period_start,
        period_end: payment.period_end,
        method: payment.method,
        status: payment.status,
        notes: payment.notes,
      })
    } else {
      setFormData({
        student_id: preSelectedStudent?.id || '',
        amount: preSelectedStudent?.monthly_rate || 0,
        currency: 'USD',
        payment_date: new Date().toISOString().split('T')[0],
        period_start: null,
        period_end: null,
        method: null,
        status: 'paid',
        notes: null,
      })
    }
    setError('')
  }, [payment, preSelectedStudent, open])

  // Auto-fill amount when student changes
  const handleStudentChange = (studentId: string) => {
    setFormData(prev => ({ ...prev, student_id: studentId }))
    const selectedStudent = students.find(s => s.id === studentId)
    if (selectedStudent?.monthly_rate && !payment) {
      setFormData(prev => ({ ...prev, amount: selectedStudent.monthly_rate! }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.student_id) {
      setError('Selecciona un estudiante.')
      return
    }
    if (!formData.amount || formData.amount <= 0) {
      setError('El monto debe ser mayor a 0.')
      return
    }
    if (!formData.payment_date) {
      setError('La fecha de pago es requerida.')
      return
    }

    setLoading(true)
    try {
      await onSubmit(formData)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">
            {payment ? 'Editar Pago' : 'Registrar Pago'}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-error-light px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Student */}
          <div>
            <Label className="text-sm font-medium text-neutral-700">
              Estudiante <span className="text-error">*</span>
            </Label>
            <Select
              value={formData.student_id}
              onValueChange={handleStudentChange}
              disabled={!!preSelectedStudent}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Seleccionar estudiante" />
              </SelectTrigger>
              <SelectContent>
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount + Date */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-sm font-medium text-neutral-700">
                Monto <span className="text-error">*</span>
              </Label>
              <div className="relative mt-1.5">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-500">$</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: Number(e.target.value) }))}
                  className="input-base pl-7"
                  required
                />
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-neutral-700">
                Fecha de pago <span className="text-error">*</span>
              </Label>
              <Input
                type="date"
                value={formData.payment_date}
                onChange={(e) => setFormData(prev => ({ ...prev, payment_date: e.target.value }))}
                className="mt-1.5 input-base"
                required
              />
            </div>
          </div>

          {/* Period */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-sm font-medium text-neutral-700">Período desde</Label>
              <Input
                type="date"
                value={formData.period_start || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, period_start: e.target.value || null }))}
                className="mt-1.5 input-base"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-neutral-700">Período hasta</Label>
              <Input
                type="date"
                value={formData.period_end || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, period_end: e.target.value || null }))}
                className="mt-1.5 input-base"
              />
            </div>
          </div>

          {/* Method + Status */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-sm font-medium text-neutral-700">Método de pago</Label>
              <Select
                value={formData.method || ''}
                onValueChange={(val) => setFormData(prev => ({ ...prev, method: val as Payment['method'] }))}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Seleccionar método" />
                </SelectTrigger>
                <SelectContent>
                  {METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium text-neutral-700">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(val) => setFormData(prev => ({ ...prev, status: val as Payment['status'] }))}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label className="text-sm font-medium text-neutral-700">Notas</Label>
            <Textarea
              placeholder="Notas adicionales..."
              value={formData.notes || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value || null }))}
              className="mt-1.5 input-base min-h-[60px]"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="btn-secondary">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="btn-accent disabled:opacity-50">
              {loading ? 'Guardando...' : payment ? 'Guardar Cambios' : 'Registrar Pago'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
