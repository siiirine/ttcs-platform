import type { Metadata } from 'next'
import { Sora, Source_Sans_3 } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import './globals.css'

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
})

const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'TTCS Platform - Monitoring Ericsson Charging System',
  description: 'Plateforme de supervision des serveurs Ericsson Charging System pour Tunisie Telecom',
  icons: {
    icon: '/ericsson.jpg',
    apple: '/ericsson.jpg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${sora.variable} ${sourceSans.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          storageKey="ttcs-theme"
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}