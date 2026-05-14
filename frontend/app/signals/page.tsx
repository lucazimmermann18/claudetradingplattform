'use client'

import dynamic from 'next/dynamic'

const SignalPanel = dynamic(() => import('@/components/signals/SignalPanel'), { ssr: false })

export default function SignalsPage() {
  return (
    <div style={{ height: '100%', maxWidth: 800, margin: '0 auto', padding: '0 20px' }}>
      <SignalPanel />
    </div>
  )
}
