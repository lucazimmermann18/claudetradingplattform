import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TradeAI Pro — Institutional Signal Engine',
  description: 'Professional AI-powered trading platform with real-time signals and market data',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
