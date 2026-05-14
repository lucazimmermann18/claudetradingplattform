'use client'

import dynamic from 'next/dynamic'

const TradingChart = dynamic(() => import('@/components/chart/TradingChart'), { ssr: false })
const SignalPanel = dynamic(() => import('@/components/signals/SignalPanel'), { ssr: false })
const WatchlistPanel = dynamic(() => import('@/components/watchlist/WatchlistPanel'), { ssr: false })
const OrderBookPanel = dynamic(() => import('@/components/orderbook/OrderBookPanel'), { ssr: false })
const PortfolioPanel = dynamic(() => import('@/components/portfolio/PortfolioPanel'), { ssr: false })
const OrderPanel = dynamic(() => import('@/components/ui/OrderPanel'), { ssr: false })

export default function DashboardPage() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '200px 1fr 280px',
      gridTemplateRows: '1fr 320px',
      height: '100%',
      gap: 0,
    }}>
      {/* Left: Watchlist (spans both rows) */}
      <div style={{
        gridColumn: '1',
        gridRow: '1 / 3',
        borderRight: '1px solid #1e2d40',
        overflow: 'hidden',
      }}>
        <WatchlistPanel />
      </div>

      {/* Center top: Chart */}
      <div style={{
        gridColumn: '2',
        gridRow: '1',
        borderBottom: '1px solid #1e2d40',
        overflow: 'hidden',
      }}>
        <TradingChart />
      </div>

      {/* Right: Signals + Order Book (spans both rows) */}
      <div style={{
        gridColumn: '3',
        gridRow: '1 / 3',
        borderLeft: '1px solid #1e2d40',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Top: Order Panel */}
        <div style={{ borderBottom: '1px solid #1e2d40', flexShrink: 0 }}>
          <OrderPanel />
        </div>
        {/* Bottom: Signal Panel */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <SignalPanel />
        </div>
      </div>

      {/* Center bottom: Portfolio + Order Book */}
      <div style={{
        gridColumn: '2',
        gridRow: '2',
        overflow: 'hidden',
        display: 'grid',
        gridTemplateColumns: '1fr 300px',
      }}>
        <div style={{ borderRight: '1px solid #1e2d40', overflow: 'hidden' }}>
          <PortfolioPanel />
        </div>
        <div style={{ overflow: 'hidden' }}>
          <OrderBookPanel />
        </div>
      </div>
    </div>
  )
}
