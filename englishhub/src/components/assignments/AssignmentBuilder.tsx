'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Save,
  Plus,
  Link as LinkIcon,
  Share2,
  Copy,
  Check,
  Loader2,
  ClipboardList,
} from 'lucide-react'
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
import { createClient } from '@/lib/supabase/client'
import { ExerciseEditor, type ExerciseData } from './ExerciseEditor'
import type { Assignment, AssignmentExercise, Lesson, ExerciseType, Student } from '@/types/database'

interface AssignmentBuilderProps {
  assignmentId?: string
}

export function AssignmentBuilder({ assignmentId }: AssignmentBuilderProps) {
  const router = useRouter()
  const supabase = createClient()

  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [exercises, setExercises] = useState<ExerciseData[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [students, setStudents] = useState<Pick<Student, 'id' | 'full_name' | 'email' | 'status'>[]>([])
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
  const [loading, setLoading] = useState(!!assignmentId)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [lessonId, setLessonId] = useState<string | null>(null)
  const [audience, setAudience] = useState<Assignment['audience']>('all_active_students')
  const [timeLimitMinutes, setTimeLimitMinutes] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [availableUntil, setAvailableUntil] = useState('')

  useEffect(() => {
    const fetchInitialData = async () => {
      const [lessonsRes, studentsRes] = await Promise.all([
        supabase
          .from('lessons')
          .select('id, title, level')
          .eq('is_published', true)
          .order('title'),
        supabase
          .from('students')
          .select('id, full_name, email, status')
          .in('status', ['active', 'trial'])
          .order('full_name'),
      ])

      if (lessonsRes.data) setLessons(lessonsRes.data as Lesson[])
      if (studentsRes.data) {
        setStudents(studentsRes.data as Pick<Student, 'id' | 'full_name' | 'email' | 'status'>[])
      }
    }
    fetchInitialData()
  }, [supabase])

  useEffect(() => {
    if (!assignmentId) return
    const fetch = async () => {
      const { data: asgn } = await supabase
        .from('assignments')
        .select('*')
        .eq('id', assignmentId)
        .single()

      if (asgn) {
        setAssignment(asgn as Assignment)
        setTitle(asgn.title)
        setDescription(asgn.description || '')
        setLessonId(asgn.lesson_id)
        setAudience((asgn.audience || 'all_active_students') as Assignment['audience'])
        setTimeLimitMinutes(asgn.time_limit_minutes ? String(asgn.time_limit_minutes) : '')
        setDueDate(asgn.due_date ? new Date(asgn.due_date).toISOString().split('T')[0] : '')
        setAvailableUntil(asgn.available_until ? toDateTimeLocal(asgn.available_until) : '')
      }

      const { data: exs } = await supabase
        .from('assignment_exercises')
        .select('*')
        .eq('assignment_id', assignmentId)
        .order('order_index')

      if (exs) {
        setExercises(exs.map((e: AssignmentExercise) => ({
          id: e.id,
          type: e.type as ExerciseType,
          question: e.question,
          options: e.options,
          correct_answer: typeof e.correct_answer === 'string' ? e.correct_answer : JSON.stringify(e.correct_answer),
          points: e.points,
          order_index: e.order_index,
        })))
      }

      const { data: recipients } = await supabase
        .from('assignment_recipients')
        .select('student_id')
        .eq('assignment_id', assignmentId)
      if (recipients) {
        setSelectedStudentIds(recipients.map((r: { student_id: string }) => r.student_id))
      }

      setLoading(false)
    }
    fetch()
  }, [assignmentId, supabase])

  const getTutorId = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    const { data: tutor } = await supabase
      .from('tutors')
      .select('id')
      .eq('auth_id', user.id)
      .single()
    if (!tutor) throw new Error('Tutor not found')
    return tutor.id
  }

  const handleSave = async () => {
    if (!title.trim()) return
    if (audience === 'selected_students' && selectedStudentIds.length === 0) return
    setSaving(true)

    try {
      let asgn = assignment

      if (!asgn) {
        const tutorId = await getTutorId()
        const { data, error } = await supabase
          .from('assignments')
          .insert({
            title,
            description: description || null,
            lesson_id: lessonId,
            audience,
            time_limit_minutes: timeLimitMinutes ? Number(timeLimitMinutes) : null,
            due_date: dueDate || null,
            available_until: availableUntil ? new Date(availableUntil).toISOString() : null,
            tutor_id: tutorId,
          })
          .select()
          .single()
        if (error) throw error
        asgn = data as Assignment
        setAssignment(asgn)
      } else {
        const { error } = await supabase
          .from('assignments')
          .update({
            title,
            description: description || null,
            lesson_id: lessonId,
            audience,
            time_limit_minutes: timeLimitMinutes ? Number(timeLimitMinutes) : null,
            due_date: dueDate || null,
            available_until: availableUntil ? new Date(availableUntil).toISOString() : null,
          })
          .eq('id', asgn.id)
        if (error) throw error
        setAssignment({
          ...asgn,
          title,
          description,
          lesson_id: lessonId,
          audience,
          time_limit_minutes: timeLimitMinutes ? Number(timeLimitMinutes) : null,
          due_date: dueDate || null,
          available_until: availableUntil ? new Date(availableUntil).toISOString() : null,
        })
      }

      await supabase
        .from('assignment_recipients')
        .delete()
        .eq('assignment_id', asgn.id)

      if (audience === 'selected_students' && selectedStudentIds.length > 0) {
        const { error: recipientsError } = await supabase
          .from('assignment_recipients')
          .insert(
            selectedStudentIds.map((studentId) => ({
              assignment_id: asgn.id,
              student_id: studentId,
            }))
          )
        if (recipientsError) throw recipientsError
      }

      if (asgn.id) {
        await supabase.from('assignment_exercises').delete().eq('assignment_id', asgn.id)

        if (exercises.length > 0) {
          const { error: exError } = await supabase.from('assignment_exercises').insert(
            exercises.map((ex, idx) => ({
              assignment_id: asgn!.id,
              type: ex.type,
              question: ex.question,
              options: ex.options,
              correct_answer: ex.type === 'matching' ? (typeof ex.correct_answer === 'string' ? JSON.parse(ex.correct_answer) : ex.correct_answer) : ex.correct_answer,
              points: ex.points,
              order_index: idx,
            }))
          )
          if (exError) throw exError
        }
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 2000)

      if (!assignmentId && asgn) {
        router.replace(`/assignments/${asgn.id}`)
      }
    } catch (err) {
      console.error('Save error:', err)
    } finally {
      setSaving(false)
    }
  }

  const addExercise = (type: ExerciseType = 'multiple_choice') => {
    const newEx: ExerciseData = {
      type,
      question: '',
      options: type === 'multiple_choice' ? ['', '', '', ''] : null,
      correct_answer: type === 'true_false' ? 'true' : '',
      points: 1,
      order_index: exercises.length,
    }
    setExercises([...exercises, newEx])
  }

  const updateExercise = (idx: number, data: ExerciseData) => {
    const newExs = [...exercises]
    newExs[idx] = data
    setExercises(newExs)
  }

  const deleteExercise = (idx: number) => {
    setExercises(exercises.filter((_, i) => i !== idx))
  }

  const moveExercise = (idx: number, direction: 'up' | 'down') => {
    const newExs = [...exercises]
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= newExs.length) return
    ;[newExs[idx], newExs[swapIdx]] = [newExs[swapIdx], newExs[idx]]
    setExercises(newExs)
  }

  const getShareUrl = () => {
    if (!assignment?.public_token) return ''
    return `${window.location.origin}/assignment/${assignment.public_token}`
  }

  const handleCopyLink = async () => {
    const url = getShareUrl()
    if (!url) return
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShareWhatsApp = () => {
    const url = getShareUrl()
    if (!url) return
    const text = encodeURIComponent(`Tarea: ${title}\n${url}`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  const handleAutoGenerate = async () => {
    if (!lessonId) return
    setSaving(true)

    try {
      const { data: sections } = await supabase
        .from('lesson_sections')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('order_index')

      if (!sections || sections.length === 0) {
        setSaving(false)
        return
      }

      const generatedExercises: ExerciseData[] = []
      let orderIdx = exercises.length

      for (const section of sections) {
        const content = section.content as Record<string, unknown>

        if (section.type === 'vocabulary' && content.words) {
          const words = content.words as { word: string; translation: string }[]
          if (words.length >= 2) {
            const pairs: Record<string, string> = {}
            words.slice(0, 5).forEach((w) => { pairs[w.word] = w.translation })
            generatedExercises.push({
              type: 'matching',
              question: 'Match the words with their translations',
              options: null,
              correct_answer: JSON.stringify(pairs),
              points: words.slice(0, 5).length,
              order_index: orderIdx++,
            })
          }
        }

        if (section.type === 'grammar' && content.examples) {
          const examples = content.examples as { sentence: string }[]
          examples.slice(0, 3).forEach((ex) => {
            const words = ex.sentence.split(' ')
            if (words.length >= 3) {
              const blankIdx = Math.floor(words.length / 2)
              const answer = words[blankIdx]
              const sentence = words.map((w, i) => i === blankIdx ? '___' : w).join(' ')
              generatedExercises.push({
                type: 'fill_blank',
                question: sentence,
                options: null,
                correct_answer: answer,
                points: 1,
                order_index: orderIdx++,
              })
            }
          })
        }
      }

      if (generatedExercises.length > 0) {
        setExercises([...exercises, ...generatedExercises])
      }
    } catch (err) {
      console.error('Auto-generate error:', err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-neutral-400">Cargando...</div>
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link href="/assignments" className="text-neutral-500 transition-colors hover:text-neutral-700">
          <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
        </Link>
        <h1 className="font-heading text-2xl text-neutral-800">
          {assignment ? 'Editar tarea' : 'Nueva tarea'}
        </h1>
        <div className="flex-1" />

        <span className="text-xs text-neutral-400">
          {saving ? (
            <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Guardando...</span>
          ) : saved ? (
            <span className="flex items-center gap-1 text-success"><Check className="h-3 w-3" /> Guardado</span>
          ) : null}
        </span>

        <Button
          onClick={handleSave}
          className="btn-primary gap-2"
          disabled={saving || !title.trim() || (audience === 'selected_students' && selectedStudentIds.length === 0)}
        >
          <Save className="h-4 w-4" strokeWidth={1.75} />
          {assignment ? 'Guardar cambios' : 'Crear tarea'}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="card-base space-y-4">
            <div>
              <Label className="text-sm font-medium text-neutral-700">Titulo *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Homework Unit 3 - Present Perfect"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-neutral-700">Descripcion</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Complete the following exercises about..."
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <Label className="text-sm font-medium text-neutral-700">Leccion asociada (opcional)</Label>
                <Select value={lessonId || 'none'} onValueChange={(v) => setLessonId(v === 'none' ? null : v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Seleccionar leccion" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin leccion</SelectItem>
                    {lessons.map((l) => (
                      <SelectItem key={l.id} value={l.id}>{l.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-48">
                <Label className="text-sm font-medium text-neutral-700">Fecha limite</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-sm font-medium text-neutral-700">Audiencia</Label>
                <Select value={audience} onValueChange={(v) => setAudience(v as Assignment['audience'])}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_active_students">Todos los estudiantes activos</SelectItem>
                    <SelectItem value="selected_students">Solo estudiantes seleccionados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-neutral-700">Limite de tiempo (minutos)</Label>
                <Input
                  type="number"
                  min={1}
                  value={timeLimitMinutes}
                  onChange={(e) => setTimeLimitMinutes(e.target.value)}
                  placeholder="Ej: 30"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-neutral-700">Disponible hasta (opcional)</Label>
              <Input
                type="datetime-local"
                value={availableUntil}
                onChange={(e) => setAvailableUntil(e.target.value)}
                className="mt-1 w-full md:max-w-sm"
              />
            </div>

            {audience === 'selected_students' && (
              <div className="rounded-lg border border-neutral-200 p-3">
                <p className="text-sm font-medium text-neutral-700">Seleccionar estudiantes</p>
                <p className="mt-1 text-xs text-neutral-500">Solo estos estudiantes veran la tarea en su portal.</p>
                <div className="mt-3 space-y-2">
                  {students.map((student) => (
                    <label key={student.id} className="flex cursor-pointer items-center justify-between rounded-md border border-neutral-100 px-3 py-2">
                      <div>
                        <p className="text-sm text-neutral-700">{student.full_name}</p>
                        {student.email && <p className="text-xs text-neutral-400">{student.email}</p>}
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedStudentIds.includes(student.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStudentIds((prev) => [...prev, student.id])
                          } else {
                            setSelectedStudentIds((prev) => prev.filter((id) => id !== student.id))
                          }
                        }}
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}

            {lessonId && (
              <Button
                type="button"
                variant="outline"
                className="btn-secondary gap-2 text-sm"
                onClick={handleAutoGenerate}
                disabled={saving}
              >
                <ClipboardList className="h-4 w-4" strokeWidth={1.75} />
                Auto-generar ejercicios desde la leccion
              </Button>
            )}
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-heading text-lg text-neutral-800">
                Ejercicios ({exercises.length})
              </h2>
              <Button onClick={() => addExercise()} className="btn-primary gap-2 text-sm">
                <Plus className="h-4 w-4" strokeWidth={1.75} />
                Agregar ejercicio
              </Button>
            </div>

            <div className="space-y-4">
              {exercises.map((ex, idx) => (
                <ExerciseEditor
                  key={idx}
                  exercise={ex}
                  index={idx}
                  total={exercises.length}
                  onChange={(data) => updateExercise(idx, data)}
                  onDelete={() => deleteExercise(idx)}
                  onMoveUp={() => moveExercise(idx, 'up')}
                  onMoveDown={() => moveExercise(idx, 'down')}
                />
              ))}

              {exercises.length === 0 && (
                <div className="card-base flex flex-col items-center justify-center py-12 text-center">
                  <ClipboardList className="h-12 w-12 text-neutral-300" strokeWidth={1.5} />
                  <p className="mt-3 text-sm text-neutral-500">Agrega ejercicios a esta tarea</p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <Button onClick={() => addExercise('multiple_choice')} variant="outline" className="btn-secondary text-xs">Opcion multiple</Button>
                    <Button onClick={() => addExercise('fill_blank')} variant="outline" className="btn-secondary text-xs">Completar</Button>
                    <Button onClick={() => addExercise('true_false')} variant="outline" className="btn-secondary text-xs">V/F</Button>
                    <Button onClick={() => addExercise('matching')} variant="outline" className="btn-secondary text-xs">Emparejar</Button>
                    <Button onClick={() => addExercise('free_text')} variant="outline" className="btn-secondary text-xs">Texto libre</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {assignment && (
            <div className="card-base space-y-4">
              <h3 className="font-semibold text-neutral-700">Compartir tarea</h3>
              <div className="rounded-lg bg-neutral-50 p-3">
                <p className="mb-2 text-xs text-neutral-500">Link publico:</p>
                <p className="break-all font-mono text-sm text-primary-700">{getShareUrl()}</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCopyLink} variant="outline" className="btn-secondary flex-1 gap-2 text-sm">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" strokeWidth={1.75} />}
                  {copied ? 'Copiado' : 'Copiar link'}
                </Button>
                <Button onClick={handleShareWhatsApp} className="btn-primary flex-1 gap-2 text-sm">
                  <Share2 className="h-4 w-4" strokeWidth={1.75} />
                  WhatsApp
                </Button>
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <LinkIcon className="h-3.5 w-3.5" strokeWidth={1.75} />
                <span>Acceso por link y validacion en servidor al enviar</span>
              </div>
            </div>
          )}

          <div className="card-base space-y-3">
            <h3 className="font-semibold text-neutral-700">Resumen</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-500">Ejercicios</span>
                <span className="font-medium text-neutral-700">{exercises.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Puntos totales</span>
                <span className="font-medium text-neutral-700">{exercises.reduce((sum, e) => sum + e.points, 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Audiencia</span>
                <span className="font-medium text-neutral-700">
                  {audience === 'selected_students' ? 'Seleccionados' : 'Todos activos'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Tiempo</span>
                <span className="font-medium text-neutral-700">
                  {timeLimitMinutes ? `${timeLimitMinutes} min` : 'Sin limite'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Estado</span>
                <span className={assignment?.is_active ? 'badge-success' : 'badge-warning'}>
                  {assignment?.is_active ? 'Activa' : 'Inactiva'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function toDateTimeLocal(value: string): string {
  const date = new Date(value)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}
