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
    portfolioApi.getTrades(100)
      .then((r) => setTrades(r.data.trades || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: '20px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <History size={20} color="#00d4ff" />
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e8edf5' }}>Trade History</h1>
      </div>

      {loading ? (
        <div style={{ color: '#4a5568', fontSize: 13 }}>Loading...</div>
      ) : trades.length === 0 ? (
        <div style={{ color: '#4a5568', fontSize: 13, textAlign: 'center', padding: '60px 0' }}>
          No trades yet
        </div>
      ) : (
        <div style={{ background: '#0f1623', border: '1px solid #1e2d40', borderRadius: 12, overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '140px 100px 80px 100px 100px 100px 100px',
            padding: '10px 16px',
            background: '#111827',
            fontSize: 10, color: '#4a5568', fontWeight: 700, letterSpacing: '0.5px',
            borderBottom: '1px solid #1e2d40',
          }}>
            <span>DATE</span>
            <span>SYMBOL</span>
            <span>SIDE</span>
            <span style={{ textAlign: 'right' }}>QUANTITY</span>
            <span style={{ textAlign: 'right' }}>PRICE</span>
            <span style={{ textAlign: 'right' }}>TOTAL</span>
            <span style={{ textAlign: 'right' }}>P&L</span>
          </div>

          {/* Rows */}
          {trades.map((trade) => (
            <div
              key={trade.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '140px 100px 80px 100px 100px 100px 100px',
                padding: '10px 16px',
                borderBottom: '1px solid #111827',
                fontSize: 12,
                alignItems: 'center',
              }}
            >
              <span style={{ color: '#7a8da8' }}>{formatDate(trade.timestamp)}</span>
              <span style={{ color: '#e8edf5', fontWeight: 600 }}>{trade.symbol.replace('USDT', '')}/USDT</span>
              <span style={{
                color: trade.side === 'BUY' ? '#00ff88' : '#ff4757',
                fontWeight: 700,
              }}>
                {trade.side}
              </span>
              <span style={{ textAlign: 'right', color: '#e8edf5' }}>{trade.quantity}</span>
              <span style={{ textAlign: 'right', color: '#e8edf5' }}>${formatPrice(trade.price)}</span>
              <span style={{ textAlign: 'right', color: '#e8edf5' }}>
                ${trade.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              <span style={{
                textAlign: 'right',
                color: trade.pnl !== undefined ? (trade.pnl >= 0 ? '#00ff88' : '#ff4757') : '#4a5568',
                fontWeight: 600,
              }}>
                {trade.pnl !== undefined ? formatPnl(trade.pnl) : '—'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
