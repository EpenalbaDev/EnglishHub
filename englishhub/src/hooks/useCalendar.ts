'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ScheduledClass, ScheduledClassWithDetails } from '@/types/database'

type CalendarView = 'week' | 'month'

function startOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day // Monday start
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function endOfWeek(date: Date): Date {
  const d = startOfWeek(date)
  d.setDate(d.getDate() + 7)
  return d
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59)
}

export function useCalendar() {
  const [classes, setClasses] = useState<ScheduledClassWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [currentView, setCurrentView] = useState<CalendarView>('week')
  const [currentDate, setCurrentDate] = useState(new Date())
  const supabase = createClient()

  const getRange = useCallback((): [Date, Date] => {
    if (currentView === 'week') {
      return [startOfWeek(currentDate), endOfWeek(currentDate)]
    }
    // For month view, get full calendar range (may include days from prev/next month)
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    // Extend to full weeks
    const calStart = startOfWeek(monthStart)
    const calEnd = new Date(endOfWeek(new Date(monthEnd.getTime() - 86400000)))
    calEnd.setDate(calEnd.getDate() + 7)
    return [calStart, calEnd]
  }, [currentView, currentDate])

  const fetchClasses = useCallback(async () => {
    setLoading(true)
    const [rangeStart, rangeEnd] = getRange()

    const { data, error } = await supabase
      .from('scheduled_classes')
      .select('*, student:students(id, full_name, email), lesson:lessons(id, title)')
      .gte('start_time', rangeStart.toISOString())
      .lte('start_time', rangeEnd.toISOString())
      .order('start_time')

    if (!error && data) {
      setClasses(data as ScheduledClassWithDetails[])
    }
    setLoading(false)
  }, [supabase, getRange])

  useEffect(() => {
    fetchClasses()
  }, [fetchClasses])

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

  const createClass = async (data: Partial<ScheduledClass> & Pick<ScheduledClass, 'title' | 'start_time' | 'end_time'>) => {
    const tutorId = await getTutorId()

    // Check for conflicts
    const { data: conflicts } = await supabase
      .from('scheduled_classes')
      .select('id, title, start_time, end_time')
      .eq('tutor_id', tutorId)
      .neq('status', 'cancelled')
      .lt('start_time', data.end_time)
      .gt('end_time', data.start_time)

    if (conflicts && conflicts.length > 0) {
      throw new Error(`Conflicto de horario con: ${conflicts[0].title}`)
    }

    const { data: created, error } = await supabase
      .from('scheduled_classes')
      .insert({ ...data, tutor_id: tutorId })
      .select()
      .single()
    if (error) throw new Error(error.message)
    await fetchClasses()
    return created as ScheduledClass
  }

  const updateClass = async (id: string, data: Partial<ScheduledClass>) => {
    // If changing time, check conflicts
    if (data.start_time && data.end_time) {
      const tutorId = await getTutorId()
      const { data: conflicts } = await supabase
        .from('scheduled_classes')
        .select('id, title')
        .eq('tutor_id', tutorId)
        .neq('id', id)
        .neq('status', 'cancelled')
        .lt('start_time', data.end_time)
        .gt('end_time', data.start_time)

      if (conflicts && conflicts.length > 0) {
        throw new Error(`Conflicto de horario con: ${conflicts[0].title}`)
      }
    }

    const { error } = await supabase
      .from('scheduled_classes')
      .update(data)
      .eq('id', id)
    if (error) throw new Error(error.message)
    await fetchClasses()
  }

  const completeClass = async (id: string) => {
    await updateClass(id, { status: 'completed' })
  }

  const cancelClass = async (id: string) => {
    await updateClass(id, { status: 'cancelled' })
  }

  const navigateNext = () => {
    setCurrentDate(prev => {
      const d = new Date(prev)
      if (currentView === 'week') d.setDate(d.getDate() + 7)
      else d.setMonth(d.getMonth() + 1)
      return d
    })
  }

  const navigatePrev = () => {
    setCurrentDate(prev => {
      const d = new Date(prev)
      if (currentView === 'week') d.setDate(d.getDate() - 7)
      else d.setMonth(d.getMonth() - 1)
      return d
    })
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const setView = (view: CalendarView) => {
    setCurrentView(view)
  }

  const deleteClass = async (id: string) => {
    const { error } = await supabase.from('scheduled_classes').delete().eq('id', id)
    if (error) throw new Error(error.message)
    await fetchClasses()
  }

  return {
    classes,
    loading,
    currentView,
    currentDate,
    navigateNext,
    navigatePrev,
    goToToday,
    setView,
    createClass,
    updateClass,
    completeClass,
    cancelClass,
    deleteClass,
    refetch: fetchClasses,
  }
}
