'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  CheckCircle,
  Clock,
  ArrowRight,
  Volume2,
  Loader2,
  ClipboardList,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import type { Assignment, AssignmentExercise } from '@/types/database'

type Step = 'identify' | 'exercises' | 'submitted'

export default function PublicAssignmentPage() {
  const params = useParams()
  const token = params.token as string
  const supabase = createClient()

  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [exercises, setExercises] = useState<AssignmentExercise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<Step>('identify')
  const [studentName, setStudentName] = useState('')
  const [studentEmail, setStudentEmail] = useState('')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ score: number; maxScore: number } | null>(null)
  const [startedAt, setStartedAt] = useState<string | null>(null)
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    const fetch = async () => {
      const { data: asgn, error: asgnErr } = await supabase
        .from('assignments')
        .select('*')
        .eq('public_token', token)
        .eq('is_active', true)
        .single()

      if (asgnErr || !asgn) {
        setError('Tarea no encontrada o no está activa.')
        setLoading(false)
        return
      }

      const now = Date.now()
      if (asgn.available_until && now > new Date(asgn.available_until).getTime()) {
        setError('La tarea ya no está disponible.')
        setLoading(false)
        return
      }
      if (asgn.due_date && now > new Date(asgn.due_date).getTime()) {
        setError('La fecha límite de esta tarea ya venció.')
        setLoading(false)
        return
      }

      setAssignment(asgn as Assignment)

      const { data: exs } = await supabase
        .from('assignment_exercises')
        .select('*')
        .eq('assignment_id', asgn.id)
        .order('order_index')

      setExercises((exs || []) as AssignmentExercise[])
      setLoading(false)
    }
    fetch()
  }, [token, supabase])

  const handleStartAssignment = () => {
    if (!studentName.trim()) return
    setSubmitError(null)
    setStartedAt(new Date().toISOString())
    setStep('exercises')
  }

  const handleSubmit = async () => {
    if (!assignment || !startedAt) return
    setSubmitting(true)
    setSubmitError(null)

    const response = await fetch('/api/assignments/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        studentName,
        studentEmail,
        answers,
        startedAt,
      }),
    })
    const payload = await response.json()

    if (response.ok && payload.submission) {
      setResult({ score: payload.submission.score, maxScore: payload.submission.max_score })
      setStep('submitted')
    } else {
      setSubmitError(payload.error || 'No se pudo enviar la tarea.')
    }
    setSubmitting(false)
  }

  const answeredCount = exercises.filter(ex => answers[ex.id] !== undefined && answers[ex.id] !== '').length

  useEffect(() => {
    if (
      step !== 'exercises' ||
      !assignment?.time_limit_minutes ||
      !startedAt
    ) {
      return
    }

    const endAt = new Date(startedAt).getTime() + assignment.time_limit_minutes * 60 * 1000
    const updateRemaining = () => {
      const remaining = Math.max(0, Math.floor((endAt - Date.now()) / 1000))
      setTimeLeftSeconds(remaining)
    }

    updateRemaining()
    const interval = setInterval(updateRemaining, 1000)
    return () => clearInterval(interval)
  }, [step, assignment?.time_limit_minutes, startedAt])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--neutral-50)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    )
  }

  if (error || !assignment) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--neutral-50)]">
        <div className="card-base max-w-md text-center">
          <ClipboardList className="mx-auto h-12 w-12 text-neutral-300" strokeWidth={1.5} />
          <h2 className="mt-4 font-heading text-xl text-neutral-700">Tarea no disponible</h2>
          <p className="mt-2 text-sm text-neutral-500">{error || 'Esta tarea no existe o ya no está activa.'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--neutral-50)] py-8 px-4">
      <div className="mx-auto max-w-[720px]">
        {/* Header */}
        <div className="mb-6 text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-primary-600">HavenLanguage</p>
          <h1 className="mt-2 font-heading text-2xl text-neutral-800 lg:text-3xl">{assignment.title}</h1>
          {assignment.description && (
            <p className="mt-2 text-sm text-neutral-500">{assignment.description}</p>
          )}
          {assignment.due_date && (
            <p className="mt-2 flex items-center justify-center gap-1 text-xs text-neutral-400">
              <Clock className="h-3.5 w-3.5" strokeWidth={1.75} />
              Fecha límite: {formatDate(assignment.due_date, 'long')}
            </p>
          )}
        </div>

        {/* Step: Identify */}
        {step === 'identify' && (
          <div className="card-base animate-fade-in space-y-4">
            <h2 className="font-heading text-lg text-neutral-700">Antes de comenzar</h2>
            <div>
              <Label className="text-sm font-medium text-neutral-700">Tu nombre *</Label>
              <Input
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Nombre completo"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-neutral-700">Email (opcional)</Label>
              <Input
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                placeholder="tu@email.com"
                type="email"
                className="mt-1"
              />
            </div>
            <Button
              onClick={handleStartAssignment}
              className="btn-primary w-full gap-2"
              disabled={!studentName.trim()}
            >
              Comenzar tarea
              <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
            </Button>
            <p className="text-center text-xs text-neutral-400">
              {exercises.length} ejercicios
            </p>
          </div>
        )}

        {/* Step: Exercises */}
        {step === 'exercises' && (
          <div className="animate-fade-in">
            {assignment.time_limit_minutes && (
              <div className={`mb-4 rounded-lg px-3 py-2 text-sm ${timeLeftSeconds === 0 ? 'bg-error-light text-error' : 'bg-warning-light text-neutral-700'}`}>
                Tiempo restante: {formatSeconds(timeLeftSeconds ?? assignment.time_limit_minutes * 60)}
              </div>
            )}
            {/* Progress bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-xs text-neutral-500 mb-2">
                <span>{answeredCount} de {exercises.length} completados</span>
                <span>{Math.round((answeredCount / exercises.length) * 100)}%</span>
              </div>
              <div className="h-2 rounded-full bg-neutral-200">
                <div
                  className="h-full rounded-full bg-primary-500 transition-all duration-300"
                  style={{ width: `${(answeredCount / exercises.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Exercises */}
            <div className="space-y-4">
              {exercises.map((ex, idx) => (
                <PublicExercise
                  key={ex.id}
                  exercise={ex}
                  index={idx}
                  answer={answers[ex.id] || ''}
                  onChange={(val) => setAnswers({ ...answers, [ex.id]: val })}
                />
              ))}
            </div>

            {/* Submit */}
            <div className="mt-8">
              {submitError && (
                <p className="mb-3 rounded-md bg-error-light px-3 py-2 text-sm text-error">{submitError}</p>
              )}
              <Button
                onClick={handleSubmit}
                className="btn-primary w-full gap-2"
                disabled={submitting || timeLeftSeconds === 0}
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</>
                ) : (
                  <>Enviar tarea</>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step: Submitted */}
        {step === 'submitted' && result && (
          <div className="card-base animate-fade-in text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-success" strokeWidth={1.5} />
            <h2 className="mt-4 font-heading text-2xl text-neutral-800">¡Tarea enviada!</h2>
            <p className="mt-2 text-neutral-500">Gracias, {studentName}.</p>

            {result.maxScore > 0 && (
              <div className="mt-6">
                <div className="inline-flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-primary-600">{result.score}</span>
                  <span className="text-lg text-neutral-400">/ {result.maxScore}</span>
                </div>
                <div className="mx-auto mt-3 h-3 w-48 rounded-full bg-neutral-200">
                  <div
                    className="h-full rounded-full bg-primary-500 transition-all"
                    style={{ width: `${Math.round((result.score / result.maxScore) * 100)}%` }}
                  />
                </div>
                <p className="mt-2 text-sm text-neutral-500">
                  {Math.round((result.score / result.maxScore) * 100)}% correcto
                </p>
              </div>
            )}

            <p className="mt-6 text-xs text-neutral-400">
              Puedes cerrar esta página. Tu profesor verá tus resultados.
            </p>
          </div>
        )}

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-neutral-300">
          Creado con HavenLanguage
        </p>
      </div>
    </div>
  )
}

function formatSeconds(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${String(secs).padStart(2, '0')}`
}

function PublicExercise({
  exercise,
  index,
  answer,
  onChange,
}: {
  exercise: AssignmentExercise
  index: number
  answer: string
  onChange: (val: string) => void
}) {
  return (
    <div className="card-base">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-50 text-xs font-medium text-primary-700">
          {index + 1}
        </span>
        <span className="text-xs font-medium uppercase tracking-wider text-neutral-400">
          {exercise.type === 'multiple_choice' && 'Opción múltiple'}
          {exercise.type === 'fill_blank' && 'Completar'}
          {exercise.type === 'true_false' && 'Verdadero/Falso'}
          {exercise.type === 'matching' && 'Emparejar'}
          {exercise.type === 'free_text' && 'Texto libre'}
          {exercise.type === 'pronunciation' && 'Pronunciación'}
        </span>
        <span className="ml-auto text-xs text-neutral-400">{exercise.points} pts</span>
      </div>

      <p className="mb-4 text-sm font-medium text-neutral-700">{exercise.question}</p>

      {/* Multiple Choice */}
      {exercise.type === 'multiple_choice' && exercise.options && (
        <div className="space-y-2">
          {(exercise.options as string[]).map((opt, i) => (
            <button
              key={i}
              onClick={() => onChange(opt)}
              className={`w-full rounded-lg border p-3 text-left text-sm transition-colors ${
                answer === opt
                  ? 'border-primary-400 bg-primary-50 text-primary-700'
                  : 'border-neutral-200 hover:bg-neutral-50 text-neutral-600'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {/* Fill Blank */}
      {exercise.type === 'fill_blank' && (
        <Input
          value={answer}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Tu respuesta..."
          className="max-w-sm"
        />
      )}

      {/* True/False */}
      {exercise.type === 'true_false' && (
        <div className="flex gap-3">
          <button
            onClick={() => onChange('true')}
            className={`flex-1 rounded-lg border-2 py-4 text-center text-sm font-medium transition-colors ${
              answer === 'true'
                ? 'border-primary-400 bg-primary-50 text-primary-700'
                : 'border-neutral-200 hover:bg-neutral-50 text-neutral-600'
            }`}
          >
            True
          </button>
          <button
            onClick={() => onChange('false')}
            className={`flex-1 rounded-lg border-2 py-4 text-center text-sm font-medium transition-colors ${
              answer === 'false'
                ? 'border-primary-400 bg-primary-50 text-primary-700'
                : 'border-neutral-200 hover:bg-neutral-50 text-neutral-600'
            }`}
          >
            False
          </button>
        </div>
      )}

      {/* Matching */}
      {exercise.type === 'matching' && (
        <MatchingExercise exercise={exercise} answer={answer} onChange={onChange} />
      )}

      {/* Free Text */}
      {exercise.type === 'free_text' && (
        <Textarea
          value={answer}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Escribe tu respuesta..."
          rows={4}
        />
      )}

      {/* Pronunciation */}
      {exercise.type === 'pronunciation' && (
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="btn-secondary gap-2"
            onClick={() => {
              const utterance = new SpeechSynthesisUtterance(exercise.question)
              utterance.lang = 'en-US'
              utterance.rate = 0.85
              speechSynthesis.speak(utterance)
            }}
          >
            <Volume2 className="h-4 w-4" strokeWidth={1.75} />
            Escuchar modelo
          </Button>
          <Input
            value={answer}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Escribe lo que escuchas..."
            className="flex-1"
          />
        </div>
      )}
    </div>
  )
}

function MatchingExercise({
  exercise,
  answer,
  onChange,
}: {
  exercise: AssignmentExercise
  answer: string
  onChange: (val: string) => void
}) {
  let pairs: Record<string, string> = {}
  try {
    pairs = typeof exercise.correct_answer === 'string'
      ? JSON.parse(exercise.correct_answer)
      : exercise.correct_answer || {}
  } catch {
    pairs = {}
  }

  let studentAnswers: Record<string, string> = {}
  try {
    studentAnswers = answer ? JSON.parse(answer) : {}
  } catch {
    studentAnswers = {}
  }

  const keys = Object.keys(pairs)
  const values = Object.values(pairs)

  const updatePair = (key: string, value: string) => {
    const newAnswers = { ...studentAnswers, [key]: value }
    onChange(JSON.stringify(newAnswers))
  }

  return (
    <div className="space-y-2">
      {keys.map((key) => (
        <div key={key} className="flex items-center gap-3">
          <span className="rounded-lg bg-neutral-100 px-3 py-2 text-sm font-medium text-neutral-700 min-w-[120px]">
            {key}
          </span>
          <span className="text-neutral-400">→</span>
          <select title="Seleccionar opción"
            value={studentAnswers[key] || ''}
            onChange={(e) => updatePair(key, e.target.value)}
            className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
          >
            <option value="">Seleccionar...</option>
            {values.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
      ))}
    </div>
  )
}
