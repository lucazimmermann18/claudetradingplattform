'use client'

import { useEffect } from 'react'
import { useTradingStore } from '@/lib/store/trading'
import { portfolioApi } from '@/lib/api/client'
import { formatPrice, formatPnl, formatPercent } from '@/lib/utils/format'
import { TrendingUp, TrendingDown, DollarSign, Award } from 'lucide-react'

function StatCard({ label, value, sub, color, icon: Icon }: {
  label: string; value: string; sub?: string; color?: string
  icon?: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>
}) {
  return (
    <div style={{
      background: 'var(--ink-800)', border: '1px solid var(--hairline)',
      borderRadius: 9, padding: '12px 14px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 10, color: 'var(--mute)', letterSpacing: '0.08em' }}>{label}</span>
        {Icon && <Icon size={13} color={color ?? 'var(--mute)'} strokeWidth={1.8} />}
      </div>
      <div className="num" style={{ fontSize: 17, fontWeight: 700, color: color ?? '#fff', letterSpacing: '-0.02em' }}>{value}</div>
      {sub && <div className="num" style={{ fontSize: 11, color: 'var(--mute)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

export default function PortfolioPanel() {
  const { positions, portfolioStats, setPositions, setPortfolioStats } = useTradingStore()

  useEffect(() => {
    Promise.all([portfolioApi.getPositions(), portfolioApi.getStats()])
      .then(([pRes, sRes]) => { setPositions(pRes.data.positions || []); setPortfolioStats(sRes.data) })
      .catch(() => {})
  }, [setPositions, setPortfolioStats])

  const stats = portfolioStats

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ height: 44, display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', borderBottom: '1px solid var(--hairline)', flexShrink: 0 }}>
        <TrendingUp size={14} color="var(--accent-blue)" />
        <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Portfolio</span>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '12px 14px' }}>
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 18 }}>
            <StatCard
              label="TOTAL VALUE" icon={DollarSign}
              value={`$${stats.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
              sub={`Cash $${stats.cash.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
              color="var(--accent-blue)"
            />
            <StatCard
              label="TOTAL P&L"
              icon={stats.totalPnl >= 0 ? TrendingUp : TrendingDown}
              value={formatPnl(stats.totalPnl)}
              sub={formatPercent(stats.totalPnlPercent)}
              color={stats.totalPnl >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}
            />
            <StatCard
              label="DAY P&L"
              value={formatPnl(stats.dayPnl)}
              sub={formatPercent(stats.dayPnlPercent)}
              color={stats.dayPnl >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}
            />
            <StatCard
              label="WIN RATE" icon={Award}
              value={`${stats.winRate.toFixed(1)}%`}
              sub={`${stats.totalTrades} trades`}
              color="var(--accent-amber)"
            />
          </div>
        )}

        {/* Positions */}
        <div style={{ fontSize: 10, color: 'var(--mute)', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 8 }}>
          OPEN POSITIONS
        </div>

        {positions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--mute)', fontSize: 12 }}>No open positions</div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', padding: '4px 10px', fontSize: 10, color: 'var(--mute)', letterSpacing: '0.06em', fontWeight: 600 }}>
              <span>PAIR</span><span style={{ textAlign: 'right' }}>QTY</span><span style={{ textAlign: 'right' }}>VALUE</span><span style={{ textAlign: 'right' }}>P&L</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {positions.map(pos => (
                <div key={pos.id} style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr',
                  padding: '10px', background: 'var(--ink-800)', border: '1px solid var(--hairline)',
                  borderRadius: 8, alignItems: 'center',
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{pos.symbol.replace('USDT','')}</div>
                    <div style={{ fontSize: 10, color: pos.side === 'LONG' ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 600 }}>{pos.side}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="num" style={{ fontSize: 12, color: '#d7dde7' }}>{pos.quantity}</div>
                    <div className="num" style={{ fontSize: 10, color: 'var(--mute)' }}>${formatPrice(pos.avgPrice)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="num" style={{ fontSize: 12, color: '#d7dde7' }}>${pos.value.toLocaleString('en-US', { maximumFractionDigits: 2 })}</div>
                    <div className="num" style={{ fontSize: 10, color: 'var(--mute)' }}>${formatPrice(pos.currentPrice)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="num" style={{ fontSize: 12, fontWeight: 600, color: pos.pnl >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>{formatPnl(pos.pnl)}</div>
                    <div className="num" style={{ fontSize: 10, color: pos.pnlPercent >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>{formatPercent(pos.pnlPercent)}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
