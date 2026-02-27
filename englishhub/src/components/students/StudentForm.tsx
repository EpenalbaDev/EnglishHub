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
import type { Student } from '@/types/database'

const LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'elementary', label: 'Elementary' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'upper_intermediate', label: 'Upper Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

const STATUSES = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
  { value: 'trial', label: 'Trial' },
]

interface StudentFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: StudentFormData) => Promise<void>
  student?: Student | null
}

export interface StudentFormData {
  full_name: string
  email: string | null
  phone: string | null
  level: Student['level']
  status: Student['status']
  monthly_rate: number | null
  notes: string | null
  enrollment_date: string
}

export function StudentForm({ open, onClose, onSubmit, student }: StudentFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<StudentFormData>({
    full_name: '',
    email: null,
    phone: null,
    level: null,
    status: 'active',
    monthly_rate: null,
    notes: null,
    enrollment_date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    if (student) {
      setFormData({
        full_name: student.full_name,
        email: student.email,
        phone: student.phone,
        level: student.level,
        status: student.status,
        monthly_rate: student.monthly_rate,
        notes: student.notes,
        enrollment_date: student.enrollment_date,
      })
    } else {
      setFormData({
        full_name: '',
        email: null,
        phone: null,
        level: null,
        status: 'active',
        monthly_rate: null,
        notes: null,
        enrollment_date: new Date().toISOString().split('T')[0],
      })
    }
    setError('')
  }, [student, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.full_name.trim()) {
      setError('El nombre es requerido.')
      return
    }

    const normalizedEmail = formData.email?.trim().toLowerCase() || null

    if (normalizedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('El formato del email no es válido.')
      return
    }

    setLoading(true)
    try {
      await onSubmit({
        ...formData,
        email: normalizedEmail,
      })
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
            {student ? 'Editar Estudiante' : 'Nuevo Estudiante'}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-error-light px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre */}
          <div>
            <Label className="text-sm font-medium text-neutral-700">
              Nombre completo <span className="text-error">*</span>
            </Label>
            <Input
              placeholder="Nombre del estudiante"
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              className="mt-1.5 input-base"
              required
            />
          </div>

          {/* Email + Phone */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-sm font-medium text-neutral-700">Email</Label>
              <Input
                type="email"
                placeholder="email@ejemplo.com"
                value={formData.email || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value || null }))}
                className="mt-1.5 input-base"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-neutral-700">Teléfono</Label>
              <Input
                type="tel"
                placeholder="+507-6000-0000"
                value={formData.phone || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value || null }))}
                className="mt-1.5 input-base"
              />
            </div>
          </div>

          {/* Level + Status */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-sm font-medium text-neutral-700">Nivel</Label>
              <Select
                value={formData.level || ''}
                onValueChange={(val) => setFormData(prev => ({ ...prev, level: val as Student['level'] }))}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Seleccionar nivel" />
                </SelectTrigger>
                <SelectContent>
                  {LEVELS.map((lvl) => (
                    <SelectItem key={lvl.value} value={lvl.value}>
                      {lvl.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium text-neutral-700">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(val) => setFormData(prev => ({ ...prev, status: val as Student['status'] }))}
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

          {/* Monthly Rate */}
          <div>
            <Label className="text-sm font-medium text-neutral-700">Tarifa mensual</Label>
            <div className="relative mt-1.5">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-500">$</span>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.monthly_rate ?? ''}
                onChange={(e) => setFormData(prev => ({ ...prev, monthly_rate: e.target.value ? Number(e.target.value) : null }))}
                className="input-base pl-7"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label className="text-sm font-medium text-neutral-700">Notas</Label>
            <Textarea
              placeholder="Notas adicionales sobre el estudiante..."
              value={formData.notes || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value || null }))}
              className="mt-1.5 input-base min-h-[80px]"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="btn-secondary">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
              {loading ? 'Guardando...' : student ? 'Guardar Cambios' : 'Crear Estudiante'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
