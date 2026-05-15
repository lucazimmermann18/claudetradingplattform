'use client'

import dynamic from 'next/dynamic'
import { useTradingStore } from '@/lib/store/trading'
import { formatPrice, formatPercent } from '@/lib/utils/format'
import type { Timeframe, ChartType } from '@/types/trading'
import { BarChart2, CandlestickChart, LineChart } from 'lucide-react'

const TradingChart = dynamic(() => import('@/components/chart/TradingChart'), { ssr: false })
const OrderBookPanel = dynamic(() => import('@/components/orderbook/OrderBookPanel'), { ssr: false })
const OrderPanel = dynamic(() => import('@/components/ui/OrderPanel'), { ssr: false })

const TIMEFRAMES: Timeframe[] = ['1m', '5m', '15m', '1h', '4h', '1d', '1w']

export default function ChartPage() {
  const { activeSymbol, tickers, timeframe, setTimeframe, chartType, setChartType } = useTradingStore()
  const ticker = tickers[activeSymbol]
  const positive = (ticker?.changePercent ?? 0) >= 0

  return (
    <div style={{ height: '100%', display: 'grid', gridTemplateColumns: '1fr 280px', overflow: 'hidden' }}>

      {/* Left: Chart + controls */}
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: '1px solid var(--hairline)' }}>

        {/* Toolbar */}
        <div style={{
          height: 44, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12,
          padding: '0 16px', borderBottom: '1px solid var(--hairline)',
        }}>
          {/* Timeframes */}
          <div style={{ display: 'flex', gap: 2 }}>
            {TIMEFRAMES.map(tf => (
              <button key={tf} onClick={() => setTimeframe(tf)} style={{
                padding: '4px 9px', borderRadius: 5, fontSize: 11, fontWeight: timeframe === tf ? 700 : 500,
                border: 'none', cursor: 'pointer',
                background: timeframe === tf ? 'rgba(0,212,255,0.12)' : 'transparent',
                color: timeframe === tf ? 'var(--accent-blue)' : 'var(--mute)',
                outline: timeframe === tf ? '1px solid rgba(0,212,255,0.25)' : 'none',
                transition: 'all 0.12s',
              }}>{tf}</button>
            ))}
          </div>

          <div style={{ width: 1, height: 16, background: 'var(--hairline)' }} />

          {/* Chart type */}
          <div style={{ display: 'flex', gap: 2 }}>
            {([
              { id: 'candlestick', icon: CandlestickChart },
              { id: 'line',        icon: LineChart },
              { id: 'bar',         icon: BarChart2 },
            ] as { id: ChartType; icon: React.ComponentType<{ size?: number }> }[]).map(({ id, icon: Icon }) => (
              <button key={id} onClick={() => setChartType(id)} style={{
                width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 5, border: 'none', cursor: 'pointer',
                background: chartType === id ? 'rgba(0,212,255,0.1)' : 'transparent',
                color: chartType === id ? 'var(--accent-blue)' : 'var(--mute)',
                outline: chartType === id ? '1px solid rgba(0,212,255,0.2)' : 'none',
              }}>
                <Icon size={14} />
              </button>
            ))}
          </div>

          {/* Live price summary */}
          {ticker && (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <span className="num" style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>${formatPrice(ticker.price)}</span>
              <span className="num" style={{ fontSize: 12, fontWeight: 600, color: positive ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                {formatPercent(ticker.changePercent)}
              </span>
              {[
                { label: 'H', value: `$${formatPrice(ticker.high24h)}`, color: 'var(--accent-green)' },
                { label: 'L', value: `$${formatPrice(ticker.low24h)}`,  color: 'var(--accent-red)' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ display: 'flex', gap: 4, alignItems: 'baseline' }}>
                  <span style={{ fontSize: 10, color: 'var(--mute)', fontWeight: 600 }}>{label}</span>
                  <span className="num" style={{ fontSize: 12, color }}>{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chart */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <TradingChart />
        </div>
      </div>

      {/* Right panel: Order Book + Order Form */}
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflow: 'hidden', borderBottom: '1px solid var(--hairline)' }}>
          <OrderBookPanel />
        </div>
        <div style={{ flexShrink: 0, overflow: 'auto' }}>
          <OrderPanel />
        </div>
      </div>
    </div>
  )
}
