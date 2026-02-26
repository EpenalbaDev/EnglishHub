'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PresentationView } from '@/components/lessons/PresentationView'
import type { Lesson, LessonSection } from '@/types/database'

export default function PresentLessonPage() {
  const params = useParams()
  const lessonId = params.id as string
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [sections, setSections] = useState<LessonSection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient()
      const [lessonRes, sectionsRes] = await Promise.all([
        supabase.from('lessons').select('*').eq('id', lessonId).single(),
        supabase.from('lesson_sections').select('*').eq('lesson_id', lessonId).order('order_index'),
      ])

      if (lessonRes.data) setLesson(lessonRes.data as Lesson)
      if (sectionsRes.data) setSections(sectionsRes.data as LessonSection[])
      setLoading(false)
    }
    fetch()
  }, [lessonId])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-primary-800 to-primary-900">
        <p className="text-white/50">Cargando presentación...</p>
      </div>
    )
  }

  return <PresentationView title={lesson?.title || ''} sections={sections} />
}
