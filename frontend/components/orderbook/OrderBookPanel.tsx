'use client'

import { useEffect, useState, useCallback } from 'react'
import { useTradingStore } from '@/lib/store/trading'
import { marketApi } from '@/lib/api/client'
import type { OrderBook, OrderBookEntry } from '@/types/trading'
import { formatPrice } from '@/lib/utils/format'
import { BookOpen } from 'lucide-react'

function BookRow({ entry, side, maxTotal }: { entry: OrderBookEntry; side: 'bid' | 'ask'; maxTotal: number }) {
  const fillPct = (entry.total / maxTotal) * 100
  const color = side === 'bid' ? '#00ff88' : '#ff4757'

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
      padding: '2px 12px', fontSize: 11, position: 'relative',
      cursor: 'pointer',
    }}>
      <div style={{
        position: 'absolute',
        top: 0, bottom: 0,
        [side === 'bid' ? 'right' : 'left']: 0,
        width: `${fillPct}%`,
        background: side === 'bid' ? 'rgba(0,255,136,0.06)' : 'rgba(255,71,87,0.06)',
        pointerEvents: 'none',
      }} />
      <span style={{ color, fontWeight: 500, zIndex: 1 }}>${formatPrice(entry.price)}</span>
      <span style={{ textAlign: 'right', color: '#e8edf5', zIndex: 1 }}>{entry.quantity.toFixed(4)}</span>
      <span style={{ textAlign: 'right', color: '#7a8da8', zIndex: 1 }}>{entry.total.toFixed(2)}</span>
    </div>
  )
}

export default function OrderBookPanel() {
  const { activeSymbol, tickers } = useTradingStore()
  const [book, setBook] = useState<OrderBook | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchBook = useCallback(async () => {
    try {
      const res = await marketApi.getOrderBook(activeSymbol, 12)
      setBook(res.data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [activeSymbol])

  useEffect(() => {
    fetchBook()
    const interval = setInterval(fetchBook, 2000)
    return () => clearInterval(interval)
  }, [fetchBook])

  const ticker = tickers[activeSymbol]
  const maxTotal = book
    ? Math.max(
        ...book.bids.map((b) => b.total),
        ...book.asks.map((a) => a.total)
      )
    : 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px', borderBottom: '1px solid #1e2d40',
        display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
      }}>
        <BookOpen size={16} color="#00d4ff" />
        <span style={{ fontSize: 14, fontWeight: 700, color: '#e8edf5' }}>Order Book</span>
        <span style={{ fontSize: 11, color: '#4a5568', marginLeft: 4 }}>{activeSymbol}</span>
      </div>

      {/* Column headers */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
        padding: '6px 12px',
        fontSize: 10, color: '#4a5568', fontWeight: 600, letterSpacing: '0.5px',
        borderBottom: '1px solid #1e2d40', flexShrink: 0,
      }}>
        <span>PRICE</span>
        <span style={{ textAlign: 'right' }}>SIZE</span>
        <span style={{ textAlign: 'right' }}>TOTAL</span>
      </div>

      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4a5568', fontSize: 12 }}>
          Loading...
        </div>
      ) : book ? (
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Asks (sell orders) - reversed */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            {[...book.asks].reverse().map((entry, i) => (
              <BookRow key={i} entry={entry} side="ask" maxTotal={maxTotal} />
            ))}
          </div>

          {/* Spread */}
          <div style={{
            padding: '8px 12px', background: '#111827',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontSize: 16, fontWeight: 800,
                color: ticker && ticker.changePercent >= 0 ? '#00ff88' : '#ff4757',
              }}>
                ${ticker ? formatPrice(ticker.price) : '—'}
              </span>
              {ticker && (
                <span style={{ fontSize: 11, color: ticker.changePercent >= 0 ? '#00ff88' : '#ff4757' }}>
                  {ticker.changePercent >= 0 ? '▲' : '▼'} {Math.abs(ticker.changePercent).toFixed(2)}%
                </span>
              )}
            </div>
            <div style={{ fontSize: 11, color: '#4a5568' }}>
              Spread: <span style={{ color: '#7a8da8' }}>${book.spread.toFixed(2)}</span>
            </div>
          </div>

          {/* Bids (buy orders) */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {book.bids.map((entry, i) => (
              <BookRow key={i} entry={entry} side="bid" maxTotal={maxTotal} />
            ))}
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4a5568', fontSize: 12 }}>
          No data
        </div>
      )}
    </div>
  )
}
