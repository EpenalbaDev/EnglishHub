import { localeCookieName } from '@/i18n/routing'
import { preferencesStorageKey, type UserPreferences } from '@/lib/preferences'

export function applyPreferencesToDocument(preferences: UserPreferences) {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  root.dataset.palette = preferences.palette
  root.dataset.mode = preferences.mode
  root.classList.toggle('dark', preferences.mode === 'dark')

  document.cookie = `${localeCookieName}=${preferences.language}; path=/; max-age=31536000; samesite=lax`

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(preferencesStorageKey, JSON.stringify(preferences))
  }
}
