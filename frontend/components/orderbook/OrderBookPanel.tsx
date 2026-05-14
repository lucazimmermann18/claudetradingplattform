'use client'

import { useEffect, useState, useCallback } from 'react'
import { useTradingStore } from '@/lib/store/trading'
import { marketApi } from '@/lib/api/client'
import { formatPrice } from '@/lib/utils/format'
import type { OrderBook } from '@/types/trading'

function Row({ price, qty, total, side, maxTotal }: {
  price: number; qty: number; total: number; side: 'bid' | 'ask'; maxTotal: number
}) {
  const pct = (total / maxTotal) * 100
  const color = side === 'bid' ? 'var(--accent-green)' : 'var(--accent-red)'
  const bg    = side === 'bid' ? 'rgba(0,255,136,0.06)' : 'rgba(255,61,90,0.06)'

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
      padding: '2px 12px', fontSize: 11, position: 'relative', cursor: 'default',
    }}>
      <div style={{
        position: 'absolute', top: 0, bottom: 0,
        [side === 'bid' ? 'right' : 'left']: 0,
        width: `${pct}%`, background: bg, pointerEvents: 'none',
      }} />
      <span className="num" style={{ color, fontWeight: 500, position: 'relative' }}>${formatPrice(price)}</span>
      <span className="num" style={{ textAlign: 'right', color: '#d7dde7', position: 'relative' }}>{qty.toFixed(4)}</span>
      <span className="num" style={{ textAlign: 'right', color: 'var(--mute)', position: 'relative' }}>{total.toFixed(2)}</span>
    </div>
  )
}

export default function OrderBookPanel() {
  const { activeSymbol, tickers } = useTradingStore()
  const [book, setBook] = useState<OrderBook | null>(null)

  const fetchBook = useCallback(async () => {
    try { const r = await marketApi.getOrderBook(activeSymbol, 12); setBook(r.data) }
    catch { /* ignore */ }
  }, [activeSymbol])

  useEffect(() => { fetchBook(); const id = setInterval(fetchBook, 2000); return () => clearInterval(id) }, [fetchBook])

  const ticker = tickers[activeSymbol]
  const maxTotal = book ? Math.max(...book.bids.map(b => b.total), ...book.asks.map(a => a.total)) : 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ height: 44, display: 'flex', alignItems: 'center', padding: '0 14px', borderBottom: '1px solid var(--hairline)', flexShrink: 0, gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Order Book</span>
        <span style={{ fontSize: 11, color: 'var(--mute)' }}>{activeSymbol.replace('USDT','/USDT')}</span>
      </div>

      {/* Column labels */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
        padding: '5px 12px 3px',
        fontSize: 10, color: 'var(--mute)', fontWeight: 600, letterSpacing: '0.08em',
        borderBottom: '1px solid var(--hairline)', flexShrink: 0,
      }}>
        <span>PRICE</span><span style={{ textAlign: 'right' }}>SIZE</span><span style={{ textAlign: 'right' }}>TOTAL</span>
      </div>

      {!book ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mute)', fontSize: 12 }}>Loading…</div>
      ) : (
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Asks (reversed — lowest at bottom) */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', overflow: 'hidden' }}>
            {[...book.asks].reverse().map((e, i) => (
              <Row key={i} price={e.price} qty={e.quantity} total={e.total} side="ask" maxTotal={maxTotal} />
            ))}
          </div>

          {/* Spread row */}
          <div style={{
            padding: '7px 12px', background: 'rgba(255,255,255,0.02)',
            borderTop: '1px solid var(--hairline)', borderBottom: '1px solid var(--hairline)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span className="num" style={{
                fontSize: 16, fontWeight: 700,
                color: ticker && ticker.changePercent >= 0 ? 'var(--accent-green)' : 'var(--accent-red)',
              }}>
                {ticker ? `$${formatPrice(ticker.price)}` : '—'}
              </span>
              {ticker && (
                <span style={{ fontSize: 11, color: ticker.changePercent >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                  {ticker.changePercent >= 0 ? '▲' : '▼'} {Math.abs(ticker.changePercent).toFixed(2)}%
                </span>
              )}
            </div>
            <span style={{ fontSize: 10, color: 'var(--mute)' }}>
              Spread <span className="num" style={{ color: '#d7dde7' }}>${book.spread.toFixed(2)}</span>
            </span>
          </div>

          {/* Bids */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {book.bids.map((e, i) => (
              <Row key={i} price={e.price} qty={e.quantity} total={e.total} side="bid" maxTotal={maxTotal} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
