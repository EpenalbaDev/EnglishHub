import { getRequestConfig } from 'next-intl/server'
import { cookies, headers } from 'next/headers'
import { defaultLocale, isLocale, localeCookieName } from './routing'

export default getRequestConfig(async () => {
  const headersList = await headers()
  const cookieStore = await cookies()

  const localeFromHeader = headersList.get('x-englishhub-locale')
  const localeFromCookie = cookieStore.get(localeCookieName)?.value
  const locale = isLocale(localeFromHeader)
    ? localeFromHeader
    : isLocale(localeFromCookie)
      ? localeFromCookie
      : defaultLocale

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
