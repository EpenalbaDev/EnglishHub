'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type {
  Assignment,
  AssignmentExercise,
  AssignmentWithExercises,
  AssignmentWithResults,
} from '@/types/database'

export function useAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchAssignments = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('assignments')
      .select('*')
      .order('updated_at', { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setAssignments(data || [])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchAssignments()
  }, [fetchAssignments])

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

  const createAssignment = async (data: Partial<Assignment> & Pick<Assignment, 'title'>) => {
    const tutorId = await getTutorId()
    const { data: assignment, error } = await supabase
      .from('assignments')
      .insert({ ...data, tutor_id: tutorId })
      .select()
      .single()
    if (error) throw new Error(error.message)
    await fetchAssignments()
    return assignment as Assignment
  }

  const updateAssignment = async (id: string, data: Partial<Assignment>) => {
    const { error } = await supabase
      .from('assignments')
      .update(data)
      .eq('id', id)
    if (error) throw new Error(error.message)
    await fetchAssignments()
  }

  const deleteAssignment = async (id: string) => {
    const { error } = await supabase.from('assignments').delete().eq('id', id)
    if (error) throw new Error(error.message)
    await fetchAssignments()
  }

  const addExercise = async (
    assignmentId: string,
    exercise: Omit<AssignmentExercise, 'id' | 'assignment_id' | 'created_at'>
  ) => {
    const { data, error } = await supabase
      .from('assignment_exercises')
      .insert({ ...exercise, assignment_id: assignmentId })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data as AssignmentExercise
  }

  const updateExercise = async (id: string, data: Partial<AssignmentExercise>) => {
    const { error } = await supabase
      .from('assignment_exercises')
      .update(data)
      .eq('id', id)
    if (error) throw new Error(error.message)
  }

  const deleteExercise = async (id: string) => {
    const { error } = await supabase.from('assignment_exercises').delete().eq('id', id)
    if (error) throw new Error(error.message)
  }

  const reorderExercises = async (assignmentId: string, orderedIds: string[]) => {
    const updates = orderedIds.map((id, index) =>
      supabase.from('assignment_exercises').update({ order_index: index }).eq('id', id)
    )
    await Promise.all(updates)
  }

  const toggleActive = async (id: string) => {
    const assignment = assignments.find(a => a.id === id)
    if (!assignment) return
    await updateAssignment(id, { is_active: !assignment.is_active })
  }

  const getAssignmentWithExercises = async (id: string): Promise<AssignmentWithExercises> => {
    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw new Error(error.message)

    const { data: exercises, error: exError } = await supabase
      .from('assignment_exercises')
      .select('*')
      .eq('assignment_id', id)
      .order('order_index')
    if (exError) throw new Error(exError.message)

    return { ...data, exercises: exercises || [] } as AssignmentWithExercises
  }

  const getResults = async (assignmentId: string): Promise<AssignmentWithResults> => {
    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('id', assignmentId)
      .single()
    if (error) throw new Error(error.message)

    const { data: exercises, error: exError } = await supabase
      .from('assignment_exercises')
      .select('*')
      .eq('assignment_id', assignmentId)
      .order('order_index')
    if (exError) throw new Error(exError.message)

    const { data: submissions, error: subError } = await supabase
      .from('assignment_submissions')
      .select('*')
      .eq('assignment_id', assignmentId)
      .order('submitted_at', { ascending: false })
    if (subError) throw new Error(subError.message)

    return {
      ...data,
      exercises: exercises || [],
      submissions: submissions || [],
    } as AssignmentWithResults
  }

  const getShareUrl = (token: string) => {
    return `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/assignment/${token}`
  }

  return {
    assignments,
    loading,
    error,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    addExercise,
    updateExercise,
    deleteExercise,
    reorderExercises,
    toggleActive,
    getAssignmentWithExercises,
    getResults,
    getShareUrl,
    refetch: fetchAssignments,
  }
}
