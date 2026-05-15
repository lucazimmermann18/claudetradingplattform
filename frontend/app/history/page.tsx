'use client'

import { useEffect, useState } from 'react'
import { portfolioApi } from '@/lib/api/client'
import { formatPrice, formatDate, formatPnl } from '@/lib/utils/format'
import type { Trade } from '@/types/trading'
import { History, TrendingUp, TrendingDown, DollarSign, Percent, Filter } from 'lucide-react'

type SideFilter = 'ALL' | 'BUY' | 'SELL'

export default function HistoryPage() {
  const [trades, setTrades]       = useState<Trade[]>([])
  const [loading, setLoading]     = useState(true)
  const [side, setSide]           = useState<SideFilter>('ALL')
  const [search, setSearch]       = useState('')

  useEffect(() => {
    portfolioApi.getTrades(100)
      .then(r => setTrades(r.data.trades ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = trades.filter(t => {
    if (side !== 'ALL' && t.side !== side) return false
    if (search && !t.symbol.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const totalPnl   = trades.reduce((s, t) => s + (t.pnl ?? 0), 0)
  const totalFees  = trades.reduce((s, t) => s + (t.fee ?? 0), 0)
  const totalVol   = trades.reduce((s, t) => s + t.total, 0)
  const winTrades  = trades.filter(t => (t.pnl ?? 0) > 0).length
  const closedTradesWithPnl = trades.filter(t => t.pnl !== undefined).length
  const winRate    = closedTradesWithPnl > 0 ? (winTrades / closedTradesWithPnl) * 100 : 0

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: '20px 24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <History size={18} color="var(--accent-blue)" />
        <h1 style={{ fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>Trade History</h1>
        <span style={{ fontSize: 12, color: 'var(--mute)', background: 'rgba(255,255,255,0.05)', borderRadius: 5, padding: '2px 8px' }}>{trades.length} trades</span>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Total P&L',   value: formatPnl(totalPnl),                             icon: TrendingUp,    color: totalPnl >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' },
          { label: 'Volume',      value: `$${(totalVol / 1000).toFixed(1)}K`,              icon: DollarSign,    color: 'var(--accent-blue)' },
          { label: 'Fees Paid',   value: `$${totalFees.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, icon: TrendingDown, color: 'var(--accent-red)' },
          { label: 'Win Rate',    value: `${winRate.toFixed(1)}%`,                         icon: Percent,       color: 'var(--accent-amber)' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} style={{ background: 'var(--ink-850)', border: '1px solid var(--hairline)', borderRadius: 10, padding: '13px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 10, color: 'var(--mute)', letterSpacing: '0.08em' }}>{label}</span>
              <Icon size={13} color={color} strokeWidth={1.8} />
            </div>
            <div className="num" style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['ALL', 'BUY', 'SELL'] as SideFilter[]).map(f => (
            <button key={f} onClick={() => setSide(f)} style={{
              padding: '6px 14px', borderRadius: 7, fontSize: 11, fontWeight: side === f ? 700 : 400,
              border: 'none', cursor: 'pointer',
              background: side === f ? (f === 'BUY' ? 'rgba(0,255,136,0.1)' : f === 'SELL' ? 'rgba(255,61,90,0.1)' : 'rgba(0,212,255,0.08)') : 'rgba(255,255,255,0.03)',
              color: side === f ? (f === 'BUY' ? 'var(--accent-green)' : f === 'SELL' ? 'var(--accent-red)' : 'var(--accent-blue)') : 'var(--mute)',
              outline: side === f ? `1px solid ${f === 'BUY' ? 'rgba(0,255,136,0.25)' : f === 'SELL' ? 'rgba(255,61,90,0.25)' : 'rgba(0,212,255,0.2)'}` : '1px solid transparent',
            }}>{f}</button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'var(--ink-850)', border: '1px solid var(--hairline)', borderRadius: 7, padding: '6px 10px' }}>
          <Filter size={11} color="var(--mute)" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter symbol…"
            style={{ background: 'transparent', border: 'none', outline: 'none', color: '#d7dde7', fontSize: 12, width: 120 }} />
        </div>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--mute)' }}>{filtered.length} of {trades.length}</span>
      </div>

      {loading ? (
        <div style={{ color: 'var(--mute)', fontSize: 13, padding: '40px 0', textAlign: 'center' }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{ color: 'var(--mute)', fontSize: 13, textAlign: 'center', padding: '60px 0' }}>No trades found</div>
      ) : (
        <div style={{ background: 'var(--ink-850)', border: '1px solid var(--hairline)', borderRadius: 10, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '160px 110px 60px 90px 110px 110px 90px',
            padding: '9px 16px', background: 'rgba(255,255,255,0.02)',
            fontSize: 10, color: 'var(--mute)', fontWeight: 700, letterSpacing: '0.08em',
            borderBottom: '1px solid var(--hairline)',
          }}>
            <span>DATE</span><span>SYMBOL</span><span>SIDE</span>
            <span style={{ textAlign: 'right' }}>QTY</span>
            <span style={{ textAlign: 'right' }}>PRICE</span>
            <span style={{ textAlign: 'right' }}>TOTAL</span>
            <span style={{ textAlign: 'right' }}>P&amp;L</span>
          </div>

          {filtered.map((t, i) => (
            <div key={t.id} style={{
              display: 'grid', gridTemplateColumns: '160px 110px 60px 90px 110px 110px 90px',
              padding: '10px 16px', fontSize: 12, alignItems: 'center',
              borderBottom: i < filtered.length - 1 ? '1px solid var(--hairline)' : 'none',
              transition: 'background 0.1s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.015)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ color: 'var(--mute)', fontSize: 11 }}>{formatDate(t.timestamp)}</span>
              <span style={{ color: '#d7dde7', fontWeight: 600 }}>{t.symbol.replace('USDT','')}<span style={{ color: 'var(--mute)', fontWeight: 400 }}>/USDT</span></span>
              <span style={{
                color: t.side === 'BUY' ? 'var(--accent-green)' : 'var(--accent-red)',
                fontWeight: 800, fontSize: 11, letterSpacing: '0.04em',
              }}>{t.side}</span>
              <span className="num" style={{ textAlign: 'right', color: '#d7dde7' }}>{t.quantity}</span>
              <span className="num" style={{ textAlign: 'right', color: '#d7dde7' }}>${formatPrice(t.price)}</span>
              <span className="num" style={{ textAlign: 'right', color: '#d7dde7' }}>
                ${t.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              <span className="num" style={{
                textAlign: 'right', fontWeight: 600,
                color: t.pnl !== undefined ? (t.pnl >= 0 ? 'var(--accent-green)' : 'var(--accent-red)') : 'var(--mute)',
              }}>
                {t.pnl !== undefined ? formatPnl(t.pnl) : '—'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
