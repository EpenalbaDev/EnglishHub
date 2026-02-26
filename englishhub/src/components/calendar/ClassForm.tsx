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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { ScheduledClass, Student, Lesson } from '@/types/database'

interface ClassFormProps {
  open: boolean
  onClose: () => void
  onSave: (data: Partial<ScheduledClass> & Pick<ScheduledClass, 'title' | 'start_time' | 'end_time'>) => Promise<void>
  initialData?: ScheduledClass | null
  defaultDate?: Date
}

const durationOptions = [
  { value: '30', label: '30 min' },
  { value: '45', label: '45 min' },
  { value: '60', label: '1 hora' },
  { value: '90', label: '1.5 horas' },
  { value: '120', label: '2 horas' },
]

const recurrenceOptions = [
  { value: 'none', label: 'Sin repetición' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'biweekly', label: 'Quincenal' },
]

export function ClassForm({ open, onClose, onSave, initialData, defaultDate }: ClassFormProps) {
  const supabase = createClient()
  const [students, setStudents] = useState<Pick<Student, 'id' | 'full_name'>[]>([])
  const [lessons, setLessons] = useState<Pick<Lesson, 'id' | 'title'>[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState('Clase de inglés')
  const [studentId, setStudentId] = useState<string>('none')
  const [lessonId, setLessonId] = useState<string>('none')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('09:00')
  const [duration, setDuration] = useState('60')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [recurrence, setRecurrence] = useState('none')

  useEffect(() => {
    if (!open) return
    const fetch = async () => {
      const { data: studs } = await supabase
        .from('students')
        .select('id, full_name')
        .eq('status', 'active')
        .order('full_name')
      if (studs) setStudents(studs)

      const { data: lsns } = await supabase
        .from('lessons')
        .select('id, title')
        .eq('is_published', true)
        .order('title')
      if (lsns) setLessons(lsns)
    }
    fetch()
  }, [open, supabase])

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title)
      setStudentId(initialData.student_id || 'none')
      setLessonId(initialData.lesson_id || 'none')
      const start = new Date(initialData.start_time)
      setDate(start.toISOString().split('T')[0])
      setTime(`${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`)
      const end = new Date(initialData.end_time)
      const mins = Math.round((end.getTime() - start.getTime()) / 60000)
      setDuration(String(mins))
      setLocation(initialData.location || '')
      setNotes(initialData.notes || '')
      setRecurrence(initialData.recurrence_rule || 'none')
    } else {
      setTitle('Clase de inglés')
      setStudentId('none')
      setLessonId('none')
      if (defaultDate) {
        setDate(defaultDate.toISOString().split('T')[0])
        setTime(`${String(defaultDate.getHours()).padStart(2, '0')}:${String(defaultDate.getMinutes()).padStart(2, '0')}`)
      } else {
        const now = new Date()
        setDate(now.toISOString().split('T')[0])
        setTime('09:00')
      }
      setDuration('60')
      setLocation('')
      setNotes('')
      setRecurrence('none')
    }
    setError(null)
  }, [initialData, defaultDate, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !date || !time) return

    setSaving(true)
    setError(null)

    try {
      const startTime = new Date(`${date}T${time}:00`)
      const endTime = new Date(startTime.getTime() + parseInt(duration) * 60000)

      await onSave({
        title,
        student_id: studentId === 'none' ? null : studentId,
        lesson_id: lessonId === 'none' ? null : lessonId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        location: location || null,
        notes: notes || null,
        recurrence_rule: recurrence === 'none' ? null : recurrence,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">
            {initialData ? 'Editar clase' : 'Nueva clase'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-error-light p-3 text-sm text-error">{error}</div>
          )}

          <div>
            <Label className="text-sm font-medium text-neutral-700">Título *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
          </div>

          <div>
            <Label className="text-sm font-medium text-neutral-700">Estudiante</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Seleccionar estudiante" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin estudiante</SelectItem>
                {students.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium text-neutral-700">Lección asociada</Label>
            <Select value={lessonId} onValueChange={setLessonId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Sin lección" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin lección</SelectItem>
                {lessons.map(l => (
                  <SelectItem key={l.id} value={l.id}>{l.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-sm font-medium text-neutral-700">Fecha *</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-sm font-medium text-neutral-700">Hora *</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-sm font-medium text-neutral-700">Duración</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {durationOptions.map(d => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-neutral-700">Ubicación</Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Zoom, Presencial, Google Meet URL..."
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-neutral-700">Repetición</Label>
            <Select value={recurrence} onValueChange={setRecurrence}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {recurrenceOptions.map(r => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium text-neutral-700">Notas</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas sobre la clase..."
              className="mt-1"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="btn-secondary">
              Cancelar
            </Button>
            <Button type="submit" className="btn-primary gap-2" disabled={saving || !title.trim()}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {initialData ? 'Guardar cambios' : 'Crear clase'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
