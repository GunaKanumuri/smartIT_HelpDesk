import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'SevaKAI | AI-Powered Support Intelligence',
  description: 'Intelligent support triage powered by AI. Every message classified, prioritized, and routed before it reaches your team.',
  metadataBase: new URL('https://sevak.ai'),
  openGraph: {
    title: 'SevaKAI — AI-Powered Support Intelligence',
    description: 'Intelligent support triage for modern businesses. Classify, prioritize, and route every ticket automatically.',
    url: 'https://sevak.ai',
    siteName: 'SevaKAI',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
      },
    ],
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,600&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className="font-body overflow-x-hidden">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
