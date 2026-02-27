'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { isSuperAdmin } from '@/lib/super-admin'

const allowedPlans = new Set(['trial', 'starter', 'pro'])
const allowedStatuses = new Set(['active', 'suspended'])

export async function updateTutorSubscriptionAction(formData: FormData) {
  const subscriptionId = String(formData.get('subscriptionId') || '')
  const plan = String(formData.get('plan') || '')
  const status = String(formData.get('status') || '')

  if (!subscriptionId || !allowedPlans.has(plan) || !allowedStatuses.has(status)) {
    return
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const canManage = await isSuperAdmin(supabase, user?.id)

  if (!canManage) {
    return
  }

  await supabase
    .from('tutor_subscriptions')
    .update({ plan, status })
    .eq('id', subscriptionId)

  revalidatePath('/super-admin')
}
