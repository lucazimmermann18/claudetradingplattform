'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { useMockMarket } from '@/lib/hooks/useMockMarket'
import ToastContainer from '@/components/ui/ToastContainer'

function MarketConnector({ children }: { children: React.ReactNode }) {
  useMockMarket()
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
      <MarketConnector>
        {children}
        <ToastContainer />
      </MarketConnector>
    </QueryClientProvider>
  )
}
