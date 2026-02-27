'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Student } from '@/types/database'

interface UseStudentsOptions {
  status?: string
  level?: string
  search?: string
}

export function useStudents(options: UseStudentsOptions = {}) {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchStudents = useCallback(async () => {
    setLoading(true)
    setError(null)

    let query = supabase
      .from('students')
      .select('*')
      .order('full_name')

    if (options.status && options.status !== 'all') {
      query = query.eq('status', options.status)
    }
    if (options.level && options.level !== 'all') {
      query = query.eq('level', options.level)
    }
    if (options.search) {
      query = query.or(`full_name.ilike.%${options.search}%,email.ilike.%${options.search}%`)
    }

    const { data, error: fetchError } = await query

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setStudents(data || [])
    }
    setLoading(false)
  }, [options.status, options.level, options.search, supabase])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  const createStudent = async (data: Partial<Student> & Pick<Student, 'full_name'>) => {
    // Get tutor_id
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: tutor } = await supabase
      .from('tutors')
      .select('id')
      .eq('auth_id', user.id)
      .single()

    if (!tutor) throw new Error('Tutor not found')

    const normalizedEmail = data.email?.trim().toLowerCase() || null

    const { data: student, error } = await supabase
      .from('students')
      .insert({ ...data, email: normalizedEmail, tutor_id: tutor.id })
      .select()
      .single()

    if (error) throw new Error(error.message)
    await fetchStudents()
    return student as Student
  }

  const updateStudent = async (id: string, data: Partial<Student>) => {
    const normalizedEmail = data.email === undefined ? undefined : data.email?.trim().toLowerCase() || null

    const { data: student, error } = await supabase
      .from('students')
      .update({ ...data, email: normalizedEmail })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    await fetchStudents()
    return student as Student
  }

  const deleteStudent = async (id: string) => {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id)

    if (error) throw new Error(error.message)
    await fetchStudents()
  }

  return {
    students,
    loading,
    error,
    createStudent,
    updateStudent,
    deleteStudent,
    refetch: fetchStudents,
  }
}
