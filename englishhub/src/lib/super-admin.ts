import 'server-only'
import type { SupabaseClient, User } from '@supabase/supabase-js'

export async function isSuperAdmin(
  supabase: SupabaseClient,
  userId: string | undefined
): Promise<boolean> {
  if (!userId) return false

  const { data, error } = await supabase
    .from('admin_roles')
    .select('id')
    .eq('user_id', userId)
    .eq('role', 'super_admin')
    .maybeSingle()

  if (error) return false
  return Boolean(data)
}

export async function getCurrentUserSuperAdminStatus(
  supabase: SupabaseClient,
  user: User | null
) {
  if (!user) return false
  return isSuperAdmin(supabase, user.id)
}
