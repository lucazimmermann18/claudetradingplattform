'use client'

import { useEffect } from 'react'
import { useTradingStore } from '@/lib/store/trading'
import { portfolioApi } from '@/lib/api/client'
import { formatPrice, formatPnl, formatPercent } from '@/lib/utils/format'
import { TrendingUp, TrendingDown, DollarSign, BarChart2, Award } from 'lucide-react'

function StatCard({ label, value, sub, color, icon: Icon }: {
  label: string; value: string; sub?: string; color?: string; icon?: React.ComponentType<{ size?: number; color?: string }>
}) {
  return (
    <div style={{
      background: '#111827', border: '1px solid #1e2d40', borderRadius: 10,
      padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, color: '#4a5568', fontWeight: 500 }}>{label}</span>
        {Icon && <Icon size={14} color={color ?? '#4a5568'} />}
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: color ?? '#e8edf5' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#7a8da8' }}>{sub}</div>}
    </div>
  )
}

export default function PortfolioPanel() {
  const { positions, portfolioStats, setPositions, setPortfolioStats } = useTradingStore()

  useEffect(() => {
    const load = async () => {
      try {
        const [posRes, statsRes] = await Promise.all([
          portfolioApi.getPositions(),
          portfolioApi.getStats(),
        ])
        setPositions(posRes.data.positions || [])
        setPortfolioStats(statsRes.data)
      } catch {
        // ignore - will be populated via WebSocket
      }
    }
    load()
  }, [setPositions, setPortfolioStats])

  const stats = portfolioStats

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px', borderBottom: '1px solid #1e2d40',
        display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
      }}>
        <TrendingUp size={16} color="#00d4ff" />
        <span style={{ fontSize: 14, fontWeight: 700, color: '#e8edf5' }}>Portfolio</span>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
        {/* Stats grid */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
            <StatCard
              label="Total Value"
              value={`$${stats.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
              sub={`Cash: $${stats.cash.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
              icon={DollarSign}
              color="#00d4ff"
            />
            <StatCard
              label="Total P&L"
              value={formatPnl(stats.totalPnl)}
              sub={formatPercent(stats.totalPnlPercent)}
              color={stats.totalPnl >= 0 ? '#00ff88' : '#ff4757'}
              icon={stats.totalPnl >= 0 ? TrendingUp : TrendingDown}
            />
            <StatCard
              label="Day P&L"
              value={formatPnl(stats.dayPnl)}
              sub={formatPercent(stats.dayPnlPercent)}
              color={stats.dayPnl >= 0 ? '#00ff88' : '#ff4757'}
            />
            <StatCard
              label="Win Rate"
              value={`${stats.winRate.toFixed(1)}%`}
              sub={`${stats.totalTrades} trades`}
              icon={Award}
              color="#ffd32a"
            />
          </div>
        )}

        {/* Positions table */}
        <div style={{ fontSize: 12, fontWeight: 700, color: '#4a5568', marginBottom: 8, letterSpacing: '0.5px' }}>
          OPEN POSITIONS
        </div>

        {positions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 20px', color: '#4a5568', fontSize: 13 }}>
            No open positions
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {/* Column headers */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '100px 1fr 1fr 1fr',
              gap: 8, padding: '6px 10px',
              fontSize: 10, color: '#4a5568', fontWeight: 600, letterSpacing: '0.5px',
            }}>
              <span>SYMBOL</span>
              <span style={{ textAlign: 'right' }}>QTY</span>
              <span style={{ textAlign: 'right' }}>VALUE</span>
              <span style={{ textAlign: 'right' }}>P&L</span>
            </div>

            {positions.map((pos) => (
              <div
                key={pos.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '100px 1fr 1fr 1fr',
                  gap: 8, padding: '10px 10px',
                  background: '#111827', borderRadius: 8,
                  border: '1px solid #1e2d40',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#e8edf5' }}>
                    {pos.symbol.replace('USDT', '')}
                  </div>
                  <div style={{
                    fontSize: 10,
                    color: pos.side === 'LONG' ? '#00ff88' : '#ff4757',
                    fontWeight: 600,
                  }}>
                    {pos.side}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: '#e8edf5' }}>{pos.quantity}</div>
                  <div style={{ fontSize: 10, color: '#4a5568' }}>${formatPrice(pos.avgPrice)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: '#e8edf5' }}>
                    ${pos.value.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: 10, color: '#4a5568' }}>${formatPrice(pos.currentPrice)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: pos.pnl >= 0 ? '#00ff88' : '#ff4757' }}>
                    {formatPnl(pos.pnl)}
                  </div>
                  <div style={{ fontSize: 10, color: pos.pnlPercent >= 0 ? '#00ff88' : '#ff4757' }}>
                    {formatPercent(pos.pnlPercent)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
