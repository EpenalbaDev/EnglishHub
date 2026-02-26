import type { AppLocale } from './routing'
import { defaultLocale, getLocaleFromPathname, replacePathLocale, withLocalePath } from './routing'

export function getLocaleFromClientPathname(pathname: string): AppLocale {
  return getLocaleFromPathname(pathname) ?? defaultLocale
}

export function toLocalizedPath(pathname: string, locale: AppLocale): string {
  return withLocalePath(pathname, locale)
}

export function swapPathLocale(pathname: string, locale: AppLocale): string {
  return replacePathLocale(pathname, locale)
}
