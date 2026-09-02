import type { Metadata } from 'next'
import { I18nProvider } from '@/lib/i18n'
import './globals.css'

export const metadata: Metadata = {
  title: 'CleanFlow',
  description: 'Gestão para negócios de limpeza',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  )
}