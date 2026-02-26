'use client'

import { useParams } from 'next/navigation'
import { LessonBuilder } from '@/components/lessons/LessonBuilder'

export default function EditLessonPage() {
  const params = useParams()
  const lessonId = params.id as string

  return <LessonBuilder lessonId={lessonId} />
}
