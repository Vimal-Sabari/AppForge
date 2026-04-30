import { getRequestConfig } from 'next-intl/server'

export const locales = ['en', 'ta', 'hi', 'ml'] as const
export type Locale = (typeof locales)[number]

export default getRequestConfig(async ({ locale }) => {
  if (!locales.includes(locale as Locale)) {
    return {
      locale: 'en',
      messages: (await import('../../messages/en.json')).default,
    }
  }

  return {
    locale: locale as string,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
