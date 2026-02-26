'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Payment, PaymentWithStudent } from '@/types/database'

interface UsePaymentsOptions {
  studentId?: string
  status?: string
  year?: number
  month?: number
}

export function usePayments(options: UsePaymentsOptions = {}) {
  const [payments, setPayments] = useState<PaymentWithStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    setError(null)

    let query = supabase
      .from('payments')
      .select('*, student:students(id, full_name, email)')
      .order('payment_date', { ascending: false })

    if (options.studentId) {
      query = query.eq('student_id', options.studentId)
    }
    if (options.status && options.status !== 'all') {
      query = query.eq('status', options.status)
    }
    if (options.year && options.month) {
      const startDate = `${options.year}-${String(options.month).padStart(2, '0')}-01`
      const endDate = new Date(options.year, options.month, 0).toISOString().split('T')[0]
      query = query.gte('payment_date', startDate).lte('payment_date', endDate)
    }

    const { data, error: fetchError } = await query

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setPayments((data || []) as PaymentWithStudent[])
    }
    setLoading(false)
  }, [options.studentId, options.status, options.year, options.month, supabase])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  const stats = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const thisMonthPayments = payments.filter(p => {
      const d = new Date(p.payment_date)
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear
    })

    const totalMonth = thisMonthPayments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + Number(p.amount), 0)

    const pending = payments.filter(p => p.status === 'pending').length

    const paidStudentIds = new Set(
      thisMonthPayments
        .filter(p => p.status === 'paid')
        .map(p => p.student_id)
    )

    return {
      totalMonth,
      pending,
      studentsUpToDate: paidStudentIds.size,
    }
  }, [payments])

  const createPayment = async (data: Partial<Payment> & Pick<Payment, 'student_id' | 'amount' | 'payment_date'>) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: tutor } = await supabase
      .from('tutors')
      .select('id')
      .eq('auth_id', user.id)
      .single()

    if (!tutor) throw new Error('Tutor not found')

    const { data: payment, error } = await supabase
      .from('payments')
      .insert({ ...data, tutor_id: tutor.id })
      .select('*, student:students(id, full_name, email)')
      .single()

    if (error) throw new Error(error.message)
    await fetchPayments()
    return payment as PaymentWithStudent
  }

  const updatePayment = async (id: string, data: Partial<Payment>) => {
    const { data: payment, error } = await supabase
      .from('payments')
      .update(data)
      .eq('id', id)
      .select('*, student:students(id, full_name, email)')
      .single()

    if (error) throw new Error(error.message)
    await fetchPayments()
    return payment as PaymentWithStudent
  }

  const cancelPayment = async (id: string) => {
    await updatePayment(id, { status: 'cancelled' })
  }

  return {
    payments,
    loading,
    error,
    stats,
    createPayment,
    updatePayment,
    cancelPayment,
    refetch: fetchPayments,
  }
}
