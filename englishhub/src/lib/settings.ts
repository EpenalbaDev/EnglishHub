import { createClient } from '@/lib/supabase/server'
import { defaultPreferences, parseUserPreferences, type UserPreferences } from '@/lib/preferences'

export function getCurrentUserPreferences(settings: unknown): UserPreferences {
  return parseUserPreferences(settings)
}

export async function getCurrentUserPreferencesFromSession(): Promise<UserPreferences> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return defaultPreferences
  }

  const { data: tutor } = await supabase
    .from('tutors')
    .select('settings')
    .eq('auth_id', user.id)
    .single()

  return getCurrentUserPreferences(tutor?.settings)
}

export async function updateCurrentUserPreferences(preferences: UserPreferences): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { data: tutor, error: fetchError } = await supabase
    .from('tutors')
    .select('settings')
    .eq('auth_id', user.id)
    .single()

  if (fetchError) {
    return { error: fetchError.message }
  }

  const current = parseUserPreferences(tutor?.settings)
  const nextSettings = {
    ...(typeof tutor?.settings === 'object' && tutor.settings ? tutor.settings : {}),
    ...current,
    ...preferences,
  }

  const { error: updateError } = await supabase
    .from('tutors')
    .update({ settings: nextSettings })
    .eq('auth_id', user.id)

  if (updateError) {
    return { error: updateError.message }
  }

  return {}
}
