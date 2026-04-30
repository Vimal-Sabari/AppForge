import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import localFont from 'next/font/local'
import '../globals.css'
import { Providers } from './providers'
import { Toaster } from 'sonner'
import { PwaRegister } from '@/components/shared/PwaRegister'

export const metadata = {
  manifest: '/manifest.json',
  themeColor: '#2563eb',
}

const geistSans = localFont({
  src: '../fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
})
const geistMono = localFont({
  src: '../fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
})

export default async function RootLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  const messages = await getMessages()

  return (
    <html lang={locale}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <PwaRegister />
            {children}
            <Toaster position="top-right" richColors />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
