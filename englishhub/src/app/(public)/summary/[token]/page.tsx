'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  BookOpen,
  Loader2,
  Lightbulb,
  MessageSquare,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { LessonSummary, Lesson } from '@/types/database'

export default function PublicSummaryPage() {
  const params = useParams()
  const token = params.token as string
  const supabase = createClient()

  const [summary, setSummary] = useState<LessonSummary | null>(null)
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      const { data: summaryData } = await supabase
        .from('lesson_summaries')
        .select('*')
        .eq('share_token', token)
        .single()

      if (!summaryData) {
        setError(true)
        setLoading(false)
        return
      }

      setSummary(summaryData as LessonSummary)

      const { data: lessonData } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', summaryData.lesson_id)
        .single()

      if (lessonData) setLesson(lessonData as Lesson)
      setLoading(false)
    }
    fetch()
  }, [token, supabase])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--neutral-50)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    )
  }

  if (error || !summary) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--neutral-50)]">
        <div className="card-base max-w-md text-center">
          <BookOpen className="mx-auto h-12 w-12 text-neutral-300" strokeWidth={1.5} />
          <h2 className="mt-4 font-heading text-xl text-neutral-700">Resumen no disponible</h2>
          <p className="mt-2 text-sm text-neutral-500">Este resumen no existe o ya no está disponible.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--neutral-50)]">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-800 to-primary-900 px-4 py-12 text-center text-white">
        <p className="text-xs font-medium uppercase tracking-wider text-primary-200">Resumen de clase</p>
        <h1 className="mt-3 font-heading text-3xl lg:text-4xl">{lesson?.title || 'Clase'}</h1>
        {lesson?.level && (
          <span className="mt-3 inline-block rounded-full bg-white/10 px-3 py-1 text-sm text-white/80">
            {lesson.level.replace('_', ' ')}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="mx-auto max-w-[720px] px-4 py-8">
        {/* Summary text */}
        <div className="card-base">
          <p className="text-sm leading-relaxed text-neutral-700 whitespace-pre-wrap">
            {summary.content}
          </p>
        </div>

        {/* Key Points */}
        {summary.key_points && summary.key_points.length > 0 && (
          <div className="mt-6">
            <div className="mb-4 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-accent-500" strokeWidth={1.75} />
              <h2 className="font-heading text-xl text-neutral-800">Key Points</h2>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {summary.key_points.map((point, i) => (
                <div key={i} className="card-base flex items-start gap-3 p-4">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-medium text-primary-700">
                    {i + 1}
                  </span>
                  <p className="text-sm text-neutral-600">{point}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Examples */}
        {summary.examples && summary.examples.length > 0 && (
          <div className="mt-6">
            <div className="mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary-500" strokeWidth={1.75} />
              <h2 className="font-heading text-xl text-neutral-800">Examples</h2>
            </div>
            <div className="space-y-3">
              {summary.examples.map((ex, i) => (
                <div key={i} className="card-base overflow-hidden p-0">
                  <div className="bg-primary-50 px-4 py-3">
                    <p className="text-sm font-medium text-primary-800">&ldquo;{ex.sentence}&rdquo;</p>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-sm text-neutral-600">{ex.explanation}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-xs text-neutral-300">Creado con HavenLanguage</p>
        </div>
      </div>
    </div>
  )
}
