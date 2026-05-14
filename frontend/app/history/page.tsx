'use client'

import { useEffect, useState } from 'react'
import { portfolioApi } from '@/lib/api/client'
import { formatPrice, formatDate, formatPnl } from '@/lib/utils/format'
import type { Trade } from '@/types/trading'
import { History } from 'lucide-react'

export default function HistoryPage() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    portfolioApi.getTrades(100).then(r => setTrades(r.data.trades || [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: '20px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <History size={18} color="var(--accent-blue)" />
        <h1 style={{ fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>Trade History</h1>
      </div>

      {loading ? (
        <div style={{ color: 'var(--mute)', fontSize: 13 }}>Loading…</div>
      ) : trades.length === 0 ? (
        <div style={{ color: 'var(--mute)', fontSize: 13, textAlign: 'center', padding: '60px 0' }}>No trades yet</div>
      ) : (
        <div style={{ background: 'var(--ink-850)', border: '1px solid var(--hairline)', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '140px 100px 70px 100px 100px 100px 90px',
            padding: '9px 16px', background: 'rgba(255,255,255,0.02)',
            fontSize: 10, color: 'var(--mute)', fontWeight: 700, letterSpacing: '0.08em',
            borderBottom: '1px solid var(--hairline)',
          }}>
            <span>DATE</span><span>SYMBOL</span><span>SIDE</span>
            <span style={{ textAlign: 'right' }}>QTY</span><span style={{ textAlign: 'right' }}>PRICE</span>
            <span style={{ textAlign: 'right' }}>TOTAL</span><span style={{ textAlign: 'right' }}>P&L</span>
          </div>

          {trades.map((t, i) => (
            <div key={t.id} style={{
              display: 'grid', gridTemplateColumns: '140px 100px 70px 100px 100px 100px 90px',
              padding: '9px 16px', fontSize: 12, alignItems: 'center',
              borderBottom: i < trades.length - 1 ? '1px solid var(--hairline)' : 'none',
            }}>
              <span style={{ color: 'var(--mute)' }}>{formatDate(t.timestamp)}</span>
              <span style={{ color: '#d7dde7', fontWeight: 600 }}>{t.symbol.replace('USDT','')}/USDT</span>
              <span style={{ color: t.side === 'BUY' ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 700 }}>{t.side}</span>
              <span className="num" style={{ textAlign: 'right', color: '#d7dde7' }}>{t.quantity}</span>
              <span className="num" style={{ textAlign: 'right', color: '#d7dde7' }}>${formatPrice(t.price)}</span>
              <span className="num" style={{ textAlign: 'right', color: '#d7dde7' }}>${t.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              <span className="num" style={{ textAlign: 'right', fontWeight: 600, color: t.pnl !== undefined ? (t.pnl >= 0 ? 'var(--accent-green)' : 'var(--accent-red)') : 'var(--mute)' }}>
                {t.pnl !== undefined ? formatPnl(t.pnl) : '—'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
