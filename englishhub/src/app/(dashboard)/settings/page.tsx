import { createClient } from '@/lib/supabase/server'
import { getCurrentUserPreferencesFromSession } from '@/lib/settings'
import { SettingsForm } from './settings-form'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: tutor } = user
    ? await supabase
        .from('tutors')
        .select('avatar_url')
        .eq('auth_id', user.id)
        .single()
    : { data: null }

  const preferences = await getCurrentUserPreferencesFromSession()

  return <SettingsForm initialPreferences={preferences} initialAvatarUrl={tutor?.avatar_url ?? null} />
}
