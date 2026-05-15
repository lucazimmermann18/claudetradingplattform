'use client'

import { useEffect, useState } from 'react'
import { useTradingStore } from '@/lib/store/trading'
import { portfolioApi } from '@/lib/api/client'
import { formatPrice, formatPnl, formatPercent } from '@/lib/utils/format'
import { TrendingUp, TrendingDown, DollarSign, Award } from 'lucide-react'
import { SkeletonCard, SkeletonRow } from '@/components/ui/Skeleton'
import EquityCurve from './EquityCurve'

function StatCard({ label, value, sub, color, icon: Icon }: {
  label: string; value: string; sub?: string; color?: string
  icon?: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>
}) {
  return (
    <div style={{ background: 'var(--ink-800)', border: '1px solid var(--hairline)', borderRadius: 9, padding: '12px 14px' }}>
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
  const [loading, setLoading] = useState(!portfolioStats)

  useEffect(() => {
    Promise.all([portfolioApi.getPositions(), portfolioApi.getStats()])
      .then(([pRes, sRes]) => {
        setPositions(pRes.data.positions ?? [])
        setPortfolioStats(sRes.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [setPositions, setPortfolioStats])

  const stats = portfolioStats

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ height: 44, display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', borderBottom: '1px solid var(--hairline)', flexShrink: 0 }}>
        <TrendingUp size={14} color="var(--accent-blue)" />
        <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Portfolio</span>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Stats grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <SkeletonCard height={72} />
            <SkeletonCard height={72} />
            <SkeletonCard height={72} />
            <SkeletonCard height={72} />
          </div>
        ) : stats ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <StatCard
                label="TOTAL VALUE" icon={DollarSign} color="var(--accent-blue)"
                value={`$${stats.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                sub={`Cash $${stats.cash.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
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
                label="WIN RATE" icon={Award} color="var(--accent-amber)"
                value={`${stats.winRate.toFixed(1)}%`}
                sub={`${stats.totalTrades} trades`}
              />
            </div>

            {/* Equity curve */}
            <EquityCurve />
          </>
        ) : null}

        {/* Positions */}
        <div>
          <div style={{ fontSize: 10, color: 'var(--mute)', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 8 }}>
            OPEN POSITIONS
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <SkeletonRow cols={4} />
              <SkeletonRow cols={4} />
              <SkeletonRow cols={4} />
            </div>
          ) : positions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--mute)', fontSize: 12 }}>
              No open positions
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', padding: '4px 10px', fontSize: 10, color: 'var(--mute)', letterSpacing: '0.06em', fontWeight: 600 }}>
                <span>PAIR</span>
                <span style={{ textAlign: 'right' }}>QTY</span>
                <span style={{ textAlign: 'right' }}>VALUE</span>
                <span style={{ textAlign: 'right' }}>P&amp;L</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {positions.map(pos => {
                  const pnlColor = pos.pnl >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'
                  return (
                    <div key={pos.id} style={{
                      display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr',
                      padding: '10px', background: 'var(--ink-800)', border: '1px solid var(--hairline)',
                      borderRadius: 8, alignItems: 'center',
                      borderLeft: `2px solid ${pnlColor}`,
                    }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{pos.symbol.replace('USDT', '')}</div>
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
                        <div className="num" style={{ fontSize: 12, fontWeight: 600, color: pnlColor }}>{formatPnl(pos.pnl)}</div>
                        <div className="num" style={{ fontSize: 10, color: pnlColor }}>{formatPercent(pos.pnlPercent)}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
