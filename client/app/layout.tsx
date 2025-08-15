import type { Metadata } from 'next'
import './globals.css'
import 'react-responsive-carousel/lib/styles/carousel.min.css'
import { Poppins } from 'next/font/google'
import Providers from '@/components/Providers'
import AuthProvider from '@/components/auth/AuthProvider'
import Navbar from '@/components/navigation/Navbar'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-poppins',
})

export const metadata: Metadata = {
  title: 'Dating Site - Find Your Perfect Match',
  description: 'A modern dating platform to connect with amazing people',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en'>
      <body className={`${poppins.variable} font-sans`}>
        <Providers>
          <AuthProvider>
            <Navbar />
            {children}
          </AuthProvider>
        </Providers>
      </body>
    </html>
  )
}
