import { redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserPreferences } from '@/lib/settings'
import { isSuperAdmin } from '@/lib/super-admin'
import { withLocalePath } from '@/i18n/routing'
import { DashboardShell } from './dashboard-shell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const locale = await getLocale()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(withLocalePath('/login', locale))
  }

  // Fetch tutor profile
  const { data: tutor } = await supabase
    .from('tutors')
    .select('full_name, email, settings, avatar_url')
    .eq('auth_id', user.id)
    .single()

  const preferences = getCurrentUserPreferences(tutor?.settings)
  const superAdmin = await isSuperAdmin(supabase, user.id)

  return (
    <DashboardShell
      tutorName={tutor?.full_name || user.email?.split('@')[0] || 'Profesor'}
      tutorEmail={tutor?.email || user.email || ''}
      tutorAvatarUrl={tutor?.avatar_url || null}
      preferences={preferences}
      isSuperAdmin={superAdmin}
    >
      {children}
    </DashboardShell>
  )
}
