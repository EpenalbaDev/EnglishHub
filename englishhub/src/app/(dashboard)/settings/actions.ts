'use server'

import { revalidatePath } from 'next/cache'
import { defaultLocale, isLocale, type AppLocale } from '@/i18n/routing'
import {
  defaultPreferences,
  isMode,
  isPalette,
  type AppMode,
  type AppPalette,
  type UserPreferences,
} from '@/lib/preferences'
import { updateCurrentUserPreferences } from '@/lib/settings'
import { updateCurrentUserAvatar } from '@/lib/settings'

interface RawPreferences {
  language: string
  palette: string
  mode: string
}

function sanitizePreferences(raw: RawPreferences): UserPreferences {
  const language: AppLocale = isLocale(raw.language) ? raw.language : defaultLocale
  const palette: AppPalette = isPalette(raw.palette) ? raw.palette : defaultPreferences.palette
  const mode: AppMode = isMode(raw.mode) ? raw.mode : defaultPreferences.mode
  return { language, palette, mode }
}

export async function savePreferences(raw: RawPreferences) {
  const preferences = sanitizePreferences(raw)
  const result = await updateCurrentUserPreferences(preferences)

  if (result.error) {
    return { ok: false as const, error: result.error }
  }

  revalidatePath('/', 'layout')
  return { ok: true as const, preferences }
}

export async function saveAvatarUrl(avatarUrl: string | null) {
  const result = await updateCurrentUserAvatar(avatarUrl)

  if (result.error) {
    return { ok: false as const, error: result.error }
  }

  revalidatePath('/', 'layout')
  return { ok: true as const }
}
