import { getRequestConfig } from 'next-intl/server'

export const locales = ['en', 'ta'] as const
export type Locale = (typeof locales)[number]

export default getRequestConfig(async (params) => {
  console.log('getRequestConfig params:', JSON.stringify(params))
  let locale = await params.requestLocale
  console.log('Awaited locale:', locale)

  if (!locale || !locales.includes(locale as Locale)) {
    console.log('Locale not found or invalid, defaulting to en')
    locale = 'en'
  }

  return {
    locale: locale as string,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
