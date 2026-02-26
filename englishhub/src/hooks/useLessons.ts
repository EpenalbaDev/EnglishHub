'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Lesson } from '@/types/database'

interface UseLessonsOptions {
  category?: string
  level?: string
  search?: string
}

export function useLessons(options: UseLessonsOptions = {}) {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchLessons = useCallback(async () => {
    setLoading(true)
    setError(null)

    let query = supabase
      .from('lessons')
      .select('*')
      .order('updated_at', { ascending: false })

    if (options.category && options.category !== 'all') {
      query = query.eq('category', options.category)
    }
    if (options.level && options.level !== 'all') {
      query = query.eq('level', options.level)
    }
    if (options.search) {
      query = query.ilike('title', `%${options.search}%`)
    }

    const { data, error: fetchError } = await query

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setLessons(data || [])
    }
    setLoading(false)
  }, [options.category, options.level, options.search, supabase])

  useEffect(() => {
    fetchLessons()
  }, [fetchLessons])

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

  const createLesson = async (data: Partial<Lesson> & Pick<Lesson, 'title'>) => {
    const tutorId = await getTutorId()
    const { data: lesson, error } = await supabase
      .from('lessons')
      .insert({ ...data, tutor_id: tutorId })
      .select()
      .single()
    if (error) throw new Error(error.message)
    await fetchLessons()
    return lesson as Lesson
  }

  const updateLesson = async (id: string, data: Partial<Lesson>) => {
    const { data: lesson, error } = await supabase
      .from('lessons')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    await fetchLessons()
    return lesson as Lesson
  }

  const deleteLesson = async (id: string) => {
    const { error } = await supabase.from('lessons').delete().eq('id', id)
    if (error) throw new Error(error.message)
    await fetchLessons()
  }

  const duplicateLesson = async (id: string) => {
    const original = lessons.find(l => l.id === id)
    if (!original) throw new Error('Lesson not found')

    const tutorId = await getTutorId()

    // Create copy
    const { data: newLesson, error: lessonError } = await supabase
      .from('lessons')
      .insert({
        tutor_id: tutorId,
        title: `${original.title} (copia)`,
        description: original.description,
        category: original.category,
        level: original.level,
        tags: original.tags,
        is_published: false,
      })
      .select()
      .single()

    if (lessonError) throw new Error(lessonError.message)

    // Copy sections
    const { data: sections } = await supabase
      .from('lesson_sections')
      .select('title, type, content, order_index')
      .eq('lesson_id', id)
      .order('order_index')

    if (sections && sections.length > 0) {
      await supabase.from('lesson_sections').insert(
        sections.map(s => ({ ...s, lesson_id: newLesson.id }))
      )
    }

    await fetchLessons()
    return newLesson as Lesson
  }

  const publishLesson = async (id: string) => {
    await updateLesson(id, { is_published: true })
  }

  const unpublishLesson = async (id: string) => {
    await updateLesson(id, { is_published: false })
  }

  return {
    lessons,
    loading,
    error,
    createLesson,
    updateLesson,
    deleteLesson,
    duplicateLesson,
    publishLesson,
    unpublishLesson,
    refetch: fetchLessons,
  }
}
