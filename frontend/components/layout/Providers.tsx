'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { useWebSocket } from '@/lib/hooks/useWebSocket'

function WSConnector({ children }: { children: React.ReactNode }) {
  useWebSocket()
  return <>{children}</>
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 5000, retry: 2 },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <WSConnector>{children}</WSConnector>
    </QueryClientProvider>
  )
}
