import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import Link from 'next/link'
import './globals.css'
import { ThemeProvider } from '@/components/dashboard/ThemeProvider'
import { FilterProvider } from '@/components/dashboard/FilterContext'

export const metadata: Metadata = {
  title: "INDRA — India's National Disaster & Risk Analytics",
  description: "INDRA is India's national disaster and risk analytics command surface for real-time incident intelligence.",
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark light',
  themeColor: '#07111f',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <ThemeProvider><FilterProvider>{children}</FilterProvider></ThemeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
        <Link href="/help" className="floating-help" aria-label="Help">?</Link>
        <Link href="/" className="floating-home" aria-label="Home">🏠</Link>
      </body>
    </html>
  )
}
