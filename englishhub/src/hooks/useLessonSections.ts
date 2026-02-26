'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { LessonSection, SectionType, SectionContent } from '@/types/database'

export function useLessonSections(lessonId: string | null) {
  const [sections, setSections] = useState<LessonSection[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const supabase = createClient()
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchSections = useCallback(async () => {
    if (!lessonId) return
    setLoading(true)

    const { data, error } = await supabase
      .from('lesson_sections')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('order_index')

    if (!error && data) {
      setSections(data as LessonSection[])
    }
    setLoading(false)
  }, [lessonId, supabase])

  useEffect(() => {
    fetchSections()
  }, [fetchSections])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  const addSection = async (type: SectionType, title: string) => {
    if (!lessonId) throw new Error('No lesson selected')

    const defaultContent = getDefaultContent(type)
    const nextOrder = sections.length

    const { data, error } = await supabase
      .from('lesson_sections')
      .insert({
        lesson_id: lessonId,
        title,
        type,
        content: defaultContent,
        order_index: nextOrder,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    const newSection = data as LessonSection
    setSections(prev => [...prev, newSection])
    return newSection
  }

  const updateSection = async (id: string, data: Partial<LessonSection>) => {
    const { data: updated, error } = await supabase
      .from('lesson_sections')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)

    setSections(prev => prev.map(s => s.id === id ? (updated as LessonSection) : s))
    setLastSaved(new Date())
    return updated as LessonSection
  }

  const autoSaveSection = (id: string, data: Partial<LessonSection>) => {
    // Update local state immediately
    setSections(prev => prev.map(s => s.id === id ? { ...s, ...data } : s))

    // Debounced save to DB
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    setSaving(true)

    saveTimerRef.current = setTimeout(async () => {
      try {
        await supabase
          .from('lesson_sections')
          .update(data)
          .eq('id', id)
        setLastSaved(new Date())
      } catch {
        // Silently fail, data is in local state
      } finally {
        setSaving(false)
      }
    }, 3000)
  }

  const deleteSection = async (id: string) => {
    const { error } = await supabase
      .from('lesson_sections')
      .delete()
      .eq('id', id)

    if (error) throw new Error(error.message)
    setSections(prev => prev.filter(s => s.id !== id))
  }

  const reorderSections = async (orderedIds: string[]) => {
    // Update local state
    const reordered = orderedIds
      .map((id, i) => {
        const section = sections.find(s => s.id === id)
        return section ? { ...section, order_index: i } : null
      })
      .filter(Boolean) as LessonSection[]

    setSections(reordered)

    // Update in DB
    for (let i = 0; i < orderedIds.length; i++) {
      await supabase
        .from('lesson_sections')
        .update({ order_index: i })
        .eq('id', orderedIds[i])
    }
  }

  return {
    sections,
    loading,
    saving,
    lastSaved,
    addSection,
    updateSection,
    autoSaveSection,
    deleteSection,
    reorderSections,
    refetch: fetchSections,
  }
}

function getDefaultContent(type: SectionType): SectionContent {
  switch (type) {
    case 'vocabulary':
      return { words: [{ word: '', translation: '', phonetic: '', example: '' }] }
    case 'grammar':
      return { explanation: '', formula: '', examples: [{ sentence: '', highlight: '' }] }
    case 'exercise':
      return { instructions: '', questions: [{ type: 'fill_blank', question: '', answer: '' }] }
    case 'pronunciation':
      return { words: [{ word: '', phonetic: '', tips: '' }] }
    default:
      return { html_content: '' }
  }
}
