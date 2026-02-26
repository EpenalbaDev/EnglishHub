'use client'

import { useEffect } from 'react'
import { applyPreferencesToDocument } from '@/lib/preferences-client'
import type { UserPreferences } from '@/lib/preferences'

interface PreferencesSyncProps {
  preferences: UserPreferences
}

export function PreferencesSync({ preferences }: PreferencesSyncProps) {
  useEffect(() => {
    applyPreferencesToDocument(preferences)
  }, [preferences])

  return null
}
