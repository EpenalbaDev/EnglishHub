import type { AppLocale } from '@/i18n/routing'
import { defaultLocale, isLocale } from '@/i18n/routing'

export const appPalettes = ['teal', 'indigo', 'rose'] as const
export type AppPalette = (typeof appPalettes)[number]

export const appModes = ['light', 'dark'] as const
export type AppMode = (typeof appModes)[number]
export const preferencesStorageKey = 'englishhub.preferences'

export interface UserPreferences {
  language: AppLocale
  palette: AppPalette
  mode: AppMode
}

export const defaultPreferences: UserPreferences = {
  language: defaultLocale,
  palette: 'teal',
  mode: 'light',
}

export function isPalette(value: string | null | undefined): value is AppPalette {
  return !!value && appPalettes.includes(value as AppPalette)
}

export function isMode(value: string | null | undefined): value is AppMode {
  return !!value && appModes.includes(value as AppMode)
}

export function parseUserPreferences(raw: unknown): UserPreferences {
  if (!raw || typeof raw !== 'object') return defaultPreferences
  const record = raw as Record<string, unknown>

  const language = typeof record.language === 'string' && isLocale(record.language)
    ? record.language
    : defaultPreferences.language
  const palette = typeof record.palette === 'string' && isPalette(record.palette)
    ? record.palette
    : defaultPreferences.palette
  const mode = typeof record.mode === 'string' && isMode(record.mode)
    ? record.mode
    : defaultPreferences.mode

  return { language, palette, mode }
}
