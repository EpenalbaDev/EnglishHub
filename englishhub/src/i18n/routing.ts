export const locales = ['es', 'en'] as const

export type AppLocale = (typeof locales)[number]

export const defaultLocale: AppLocale = 'es'
export const localeCookieName = 'NEXT_LOCALE'

export function isLocale(value: string | null | undefined): value is AppLocale {
  return !!value && locales.includes(value as AppLocale)
}

export function normalizePathname(pathname: string): string {
  if (!pathname) return '/'
  return pathname.startsWith('/') ? pathname : `/${pathname}`
}

export function getLocaleFromPathname(pathname: string): AppLocale | null {
  const normalized = normalizePathname(pathname)
  const segments = normalized.split('/')
  const maybeLocale = segments[1]
  return isLocale(maybeLocale) ? maybeLocale : null
}

export function stripLocalePrefix(pathname: string): string {
  const normalized = normalizePathname(pathname)
  const locale = getLocaleFromPathname(normalized)
  if (!locale) return normalized

  const withoutLocale = normalized.slice(locale.length + 1)
  return withoutLocale ? withoutLocale : '/'
}

export function withLocalePath(pathname: string, locale: AppLocale): string {
  const normalized = normalizePathname(pathname)
  const basePath = stripLocalePrefix(normalized)
  return basePath === '/' ? `/${locale}` : `/${locale}${basePath}`
}

export function replacePathLocale(pathname: string, locale: AppLocale): string {
  return withLocalePath(pathname, locale)
}
