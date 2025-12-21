import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Finance Manager - Gerencie suas Finanças',
  description: 'Sistema avançado de gestão financeira pessoal',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
