'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import {
  BarChart3,
  Users,
  Trophy,
  Clock,
  Pencil,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import { AssignmentBuilder } from '@/components/assignments/AssignmentBuilder'
import { StatsCard } from '@/components/shared/StatsCard'
import { formatDate } from '@/lib/utils'
import type { AssignmentWithResults, AssignmentSubmission, AssignmentExercise } from '@/types/database'

export default function AssignmentDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [tab, setTab] = useState('edit')
  const [results, setResults] = useState<AssignmentWithResults | null>(null)
  const [loadingResults, setLoadingResults] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<AssignmentSubmission | null>(null)
  const supabase = createClient()

  const fetchResults = async () => {
    setLoadingResults(true)
    const { data: assignment } = await supabase
      .from('assignments')
      .select('*')
      .eq('id', id)
      .single()

    const { data: exercises } = await supabase
      .from('assignment_exercises')
      .select('*')
      .eq('assignment_id', id)
      .order('order_index')

    const { data: submissions } = await supabase
      .from('assignment_submissions')
      .select('*, student:students(id, full_name, email)')
      .eq('assignment_id', id)
      .order('submitted_at', { ascending: false })

    if (assignment) {
      setResults({
        ...assignment,
        exercises: exercises || [],
        submissions: submissions || [],
      } as AssignmentWithResults)
    }
    setLoadingResults(false)
  }

  return (
    <div className="animate-fade-in">
      <Tabs
        value={tab}
        onValueChange={(value) => {
          setTab(value)
          if (value === 'results') {
            fetchResults()
          }
        }}
      >
        <div className="mb-6 flex items-center gap-4">
          <TabsList>
            <TabsTrigger value="edit" className="gap-2">
              <Pencil className="h-4 w-4" strokeWidth={1.75} />
              Editar
            </TabsTrigger>
            <TabsTrigger value="results" className="gap-2">
              <BarChart3 className="h-4 w-4" strokeWidth={1.75} />
              Resultados
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="edit">
          <AssignmentBuilder assignmentId={id} />
        </TabsContent>

        <TabsContent value="results">
          {loadingResults ? (
            <div className="flex h-64 items-center justify-center text-neutral-400">Cargando resultados...</div>
          ) : results ? (
            <ResultsView
              results={results}
              selectedSubmission={selectedSubmission}
              onSelectSubmission={setSelectedSubmission}
            />
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ResultsView({
  results,
  selectedSubmission,
  onSelectSubmission,
}: {
  results: AssignmentWithResults
  selectedSubmission: AssignmentSubmission | null
  onSelectSubmission: (s: AssignmentSubmission | null) => void
}) {
  const submissions = results.submissions
  const linkedSubmissions = submissions.filter((submission) => !submission.is_guest_submission)
  const guestSubmissions = submissions.filter((submission) => submission.is_guest_submission)
  const avgScore = submissions.length > 0
    ? submissions.reduce((sum, s) => sum + (s.score || 0), 0) / submissions.length
    : 0
  const totalMaxScore = submissions[0]?.max_score || results.exercises.reduce((sum, e) => sum + e.points, 0)

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatsCard
          title="Entregas"
          value={submissions.length.toString()}
          icon={Users}
          color="primary"
        />
        <StatsCard
          title="Promedio"
          value={totalMaxScore > 0 ? `${Math.round((avgScore / totalMaxScore) * 100)}%` : '—'}
          icon={BarChart3}
          color="accent"
        />
        <StatsCard
          title="Entregas invitado"
          value={guestSubmissions.length.toString()}
          icon={Trophy}
          color="info"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Submissions table */}
        <div className="card-base">
          <h3 className="mb-4 font-semibold text-neutral-700">Entregas</h3>
          {submissions.length === 0 ? (
            <p className="py-8 text-center text-sm text-neutral-400">Aún no hay entregas</p>
          ) : (
            <div className="space-y-4">
              <SubmissionList
                title={`Vinculadas (${linkedSubmissions.length})`}
                submissions={linkedSubmissions}
                selectedSubmission={selectedSubmission}
                onSelectSubmission={onSelectSubmission}
              />
              <SubmissionList
                title={`Invitado (${guestSubmissions.length})`}
                submissions={guestSubmissions}
                selectedSubmission={selectedSubmission}
                onSelectSubmission={onSelectSubmission}
              />
            </div>
          )}
        </div>

        {/* Submission detail */}
        <div className="card-base">
          <h3 className="mb-4 font-semibold text-neutral-700">Detalle de entrega</h3>
          {selectedSubmission ? (
            <SubmissionDetail
              submission={selectedSubmission}
              exercises={results.exercises}
            />
          ) : (
            <p className="py-8 text-center text-sm text-neutral-400">
              Selecciona una entrega para ver el detalle
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function SubmissionList({
  title,
  submissions,
  selectedSubmission,
  onSelectSubmission,
}: {
  title: string
  submissions: AssignmentSubmission[]
  selectedSubmission: AssignmentSubmission | null
  onSelectSubmission: (s: AssignmentSubmission | null) => void
}) {
  if (submissions.length === 0) return null

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">{title}</p>
      <div className="space-y-2">
        {submissions.map((sub) => (
          <button
            key={sub.id}
            onClick={() => onSelectSubmission(sub)}
            className={`w-full rounded-lg border p-3 text-left transition-colors ${
              selectedSubmission?.id === sub.id
                ? 'border-primary-300 bg-primary-50'
                : 'border-neutral-100 hover:bg-neutral-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-700">
                  {sub.student_name || 'Anónimo'}
                </p>
                {sub.student_email && (
                  <p className="text-xs text-neutral-400">{sub.student_email}</p>
                )}
              </div>
              <div className="text-right">
                {sub.score !== null && sub.max_score !== null ? (
                  <>
                    <p className="text-sm font-semibold text-neutral-700">
                      {sub.score}/{sub.max_score}
                    </p>
                    <div className="mt-1 h-1.5 w-16 rounded-full bg-neutral-200">
                      <div
                        className="h-full rounded-full bg-primary-500 transition-all"
                        style={{ width: `${Math.round((sub.score / sub.max_score) * 100)}%` }}
                      />
                    </div>
                  </>
                ) : (
                  <span className="badge-warning">Pendiente</span>
                )}
              </div>
            </div>
            <p className="mt-1 flex items-center gap-1 text-xs text-neutral-400">
              <Clock className="h-3 w-3" strokeWidth={1.75} />
              {formatDate(sub.submitted_at)}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}

function SubmissionDetail({
  submission,
  exercises,
}: {
  submission: AssignmentSubmission
  exercises: AssignmentExercise[]
}) {
  const answers = submission.answers as Record<string, string>

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-neutral-50 p-3">
        <p className="text-sm font-medium text-neutral-700">{submission.student_name || 'Anónimo'}</p>
        {submission.student_email && <p className="text-xs text-neutral-400">{submission.student_email}</p>}
        <p className="mt-1 text-xs text-neutral-400">{formatDate(submission.submitted_at, 'long')}</p>
      </div>

      {exercises.map((ex, idx) => {
        const studentAnswer = answers[ex.id]
        const correctAnswer = typeof ex.correct_answer === 'string' ? ex.correct_answer : JSON.stringify(ex.correct_answer)

        let isCorrect = false
        if (ex.type === 'free_text') {
          isCorrect = false // manual grading
        } else if (ex.type === 'fill_blank') {
          isCorrect = studentAnswer?.toLowerCase().trim() === correctAnswer?.toLowerCase().trim()
        } else {
          isCorrect = JSON.stringify(studentAnswer) === JSON.stringify(ex.correct_answer)
        }

        return (
          <div key={ex.id} className="rounded-lg border border-neutral-100 p-3">
            <div className="flex items-start gap-2">
              {ex.type !== 'free_text' ? (
                isCorrect ? (
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-success" strokeWidth={1.75} />
                ) : (
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-error" strokeWidth={1.75} />
                )
              ) : (
                <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-neutral-200" />
              )}
              <div className="flex-1">
                <p className="text-sm text-neutral-700">
                  <span className="font-medium text-neutral-400 mr-1">#{idx + 1}</span>
                  {ex.question}
                </p>
                <div className="mt-2 space-y-1 text-xs">
                  <p>
                    <span className="text-neutral-400">Respuesta: </span>
                    <span className={isCorrect ? 'text-success font-medium' : 'text-error font-medium'}>
                      {studentAnswer || '(sin respuesta)'}
                    </span>
                  </p>
                  {!isCorrect && ex.type !== 'free_text' && (
                    <p>
                      <span className="text-neutral-400">Correcta: </span>
                      <span className="text-success font-medium">{correctAnswer}</span>
                    </p>
                  )}
                </div>
              </div>
              <span className="text-xs text-neutral-400">{ex.points} pts</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
