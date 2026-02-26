import { getCurrentUserPreferencesFromSession } from '@/lib/settings'
import { SettingsForm } from './settings-form'

export default async function SettingsPage() {
  const preferences = await getCurrentUserPreferencesFromSession()

  return <SettingsForm initialPreferences={preferences} />
}
