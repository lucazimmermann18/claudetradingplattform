'use client'

import { useState } from 'react'
import { useTradingStore } from '@/lib/store/trading'
import { formatPrice, formatPercent } from '@/lib/utils/format'
import { Star, Search, TrendingUp, TrendingDown, Minus, Plus, X, BarChart2 } from 'lucide-react'
import Link from 'next/link'

const ALL_SYMBOLS = [
  'BTCUSDT','ETHUSDT','SOLUSDT','BNBUSDT','XRPUSDT',
  'ADAUSDT','DOTUSDT','AVAXUSDT','MATICUSDT','LINKUSDT',
  'LTCUSDT','DOGEUSDT','ATOMUSDT','UNIUSDT','APTUSDT',
]

function Sparkline({ prices, positive }: { prices: number[]; positive: boolean }) {
  if (prices.length < 2) return <svg width={80} height={32} />
  const min = Math.min(...prices), max = Math.max(...prices), range = max - min || 1
  const w = 80, h = 32, pad = 2
  const pts = prices.map((p, i) => {
    const x = pad + (i / (prices.length - 1)) * (w - pad * 2)
    const y = pad + (1 - (p - min) / range) * (h - pad * 2)
    return `${x},${y}`
  }).join(' ')
  const color = positive ? '#00ff88' : '#ff3d5a'
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`wl-${positive ? 'g' : 'r'}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={`${pad},${h} ${pts} ${w - pad},${h}`} fill={`url(#wl-${positive ? 'g' : 'r'})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function WatchlistPage() {
  const { watchlist, tickers, priceHistory, signals, activeSymbol, setActiveSymbol, addToWatchlist, removeFromWatchlist } = useTradingStore()
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [sort, setSort] = useState<'default' | 'price' | 'change' | 'volume'>('default')

  const toAdd = ALL_SYMBOLS.filter(s => !watchlist.includes(s))

  let items = watchlist
    .filter(s => s.toLowerCase().includes(search.toLowerCase()))
    .map(sym => ({
      sym,
      ticker: tickers[sym],
      signal: signals.find(s => s.symbol === sym),
      history: priceHistory[sym] ?? [],
    }))

  if (sort === 'change') items = [...items].sort((a, b) => (b.ticker?.changePercent ?? 0) - (a.ticker?.changePercent ?? 0))
  if (sort === 'price')  items = [...items].sort((a, b) => (b.ticker?.price ?? 0) - (a.ticker?.price ?? 0))
  if (sort === 'volume') items = [...items].sort((a, b) => (b.ticker?.volume ?? 0) - (a.ticker?.volume ?? 0))

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: '20px 24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Star size={18} color="var(--accent-amber)" fill="var(--accent-amber)" />
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>Watchlist</h1>
          <span style={{ fontSize: 12, color: 'var(--mute)', background: 'rgba(255,255,255,0.05)', borderRadius: 5, padding: '2px 8px' }}>{watchlist.length} symbols</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowAdd(v => !v)} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8,
            border: '1px solid rgba(0,212,255,0.2)', background: 'rgba(0,212,255,0.06)',
            color: 'var(--accent-blue)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>
            <Plus size={13} /> Add Symbol
          </button>
        </div>
      </div>

      {/* Search + sort bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--ink-850)', border: '1px solid var(--hairline)', borderRadius: 8, padding: '8px 12px',
        }}>
          <Search size={13} color="var(--mute)" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search symbols…"
            style={{ background: 'transparent', border: 'none', outline: 'none', color: '#d7dde7', fontSize: 13, flex: 1 }} />
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['default', 'change', 'price', 'volume'] as const).map(s => (
            <button key={s} onClick={() => setSort(s)} style={{
              padding: '6px 12px', borderRadius: 7, fontSize: 11, fontWeight: sort === s ? 700 : 400,
              border: 'none', cursor: 'pointer',
              background: sort === s ? 'rgba(0,212,255,0.1)' : 'rgba(255,255,255,0.03)',
              color: sort === s ? 'var(--accent-blue)' : 'var(--mute)',
              outline: sort === s ? '1px solid rgba(0,212,255,0.2)' : '1px solid var(--hairline)',
            }}>{s === 'default' ? 'Default' : s.charAt(0).toUpperCase() + s.slice(1)}</button>
          ))}
        </div>
      </div>

      {/* Add panel */}
      {showAdd && (
        <div style={{
          padding: '12px 16px', marginBottom: 16,
          background: 'var(--ink-850)', border: '1px solid var(--hairline)', borderRadius: 10,
          display: 'flex', flexWrap: 'wrap', gap: 6,
        }}>
          <span style={{ fontSize: 11, color: 'var(--mute)', width: '100%', marginBottom: 4, fontWeight: 600, letterSpacing: '0.06em' }}>
            ADD TO WATCHLIST
          </span>
          {toAdd.length === 0
            ? <span style={{ fontSize: 12, color: 'var(--mute)' }}>All symbols already added</span>
            : toAdd.map(sym => (
              <button key={sym} onClick={() => { addToWatchlist(sym); if (toAdd.length === 1) setShowAdd(false) }} style={{
                padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.2)',
                color: 'var(--accent-blue)', cursor: 'pointer',
              }}>+{sym.replace('USDT', '/USDT')}</button>
            ))
          }
        </div>
      )}

      {/* Table header */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 100px 80px 100px 140px 160px 80px',
        padding: '7px 16px',
        background: 'var(--ink-850)', border: '1px solid var(--hairline)',
        borderRadius: '8px 8px 0 0',
        fontSize: 10, color: 'var(--mute)', fontWeight: 700, letterSpacing: '0.08em',
      }}>
        <span>PAIR</span>
        <span style={{ textAlign: 'right' }}>PRICE</span>
        <span style={{ textAlign: 'right' }}>24H %</span>
        <span style={{ textAlign: 'right' }}>VOLUME</span>
        <span style={{ textAlign: 'center' }}>TREND</span>
        <span style={{ textAlign: 'center' }}>AI SIGNAL</span>
        <span style={{ textAlign: 'center' }}>ACTION</span>
      </div>

      {/* Rows */}
      <div style={{ background: 'var(--ink-850)', border: '1px solid var(--hairline)', borderTop: 'none', borderRadius: '0 0 10px 10px', overflow: 'hidden' }}>
        {items.map(({ sym, ticker, signal, history }, i) => {
          const active = sym === activeSymbol
          const positive = (ticker?.changePercent ?? 0) >= 0
          const sigType = signal?.type
          const sigColor = sigType === 'BUY' ? 'var(--accent-green)' : sigType === 'SELL' ? 'var(--accent-red)' : 'var(--mute)'
          const SigIcon = sigType === 'BUY' ? TrendingUp : sigType === 'SELL' ? TrendingDown : Minus

          return (
            <div key={sym} onClick={() => setActiveSymbol(sym)} style={{
              display: 'grid', gridTemplateColumns: '1fr 100px 80px 100px 140px 160px 80px',
              padding: '10px 16px', alignItems: 'center', cursor: 'pointer',
              background: active ? 'rgba(0,212,255,0.04)' : 'transparent',
              borderLeft: `3px solid ${active ? 'var(--accent-blue)' : 'transparent'}`,
              borderBottom: i < items.length - 1 ? '1px solid var(--hairline)' : 'none',
              transition: 'background 0.12s',
            }}>

              {/* Symbol */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: active ? 'rgba(0,212,255,0.1)' : 'rgba(255,255,255,0.04)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800, color: active ? 'var(--accent-blue)' : 'var(--mute)',
                  letterSpacing: '-0.02em',
                }}>
                  {sym.replace('USDT','').slice(0, 3)}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: active ? 'var(--accent-blue)' : '#d7dde7' }}>
                    {sym.replace('USDT','')}<span style={{ color: 'var(--mute)', fontWeight: 400, fontSize: 11 }}>/USDT</span>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div style={{ textAlign: 'right' }}>
                {ticker
                  ? <span className="num" style={{ fontSize: 13, fontWeight: 600, color: '#d7dde7' }}>${formatPrice(ticker.price)}</span>
                  : <span style={{ color: 'rgba(255,255,255,0.1)' }}>···</span>}
              </div>

              {/* 24h % */}
              <div style={{ textAlign: 'right' }}>
                {ticker && (
                  <span className="num" style={{ fontSize: 12, fontWeight: 700, color: positive ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                    {formatPercent(ticker.changePercent)}
                  </span>
                )}
              </div>

              {/* Volume */}
              <div style={{ textAlign: 'right' }}>
                {ticker && (
                  <span className="num" style={{ fontSize: 11, color: 'var(--mute)' }}>
                    {(ticker.volume / 1e6).toFixed(1)}M
                  </span>
                )}
              </div>

              {/* Sparkline */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Sparkline prices={history} positive={positive} />
              </div>

              {/* Signal */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                {signal ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '4px 10px', borderRadius: 6,
                      background: sigType === 'BUY' ? 'rgba(0,255,136,0.08)' : sigType === 'SELL' ? 'rgba(255,61,90,0.08)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${sigType === 'BUY' ? 'rgba(0,255,136,0.25)' : sigType === 'SELL' ? 'rgba(255,61,90,0.25)' : 'var(--hairline)'}`,
                    }}>
                      <SigIcon size={11} color={sigColor} />
                      <span style={{ fontSize: 11, fontWeight: 800, color: sigColor, letterSpacing: '0.06em' }}>{sigType}</span>
                      <span className="num" style={{ fontSize: 10, color: 'var(--mute)' }}>{signal.confidence}%</span>
                    </div>
                  </div>
                ) : (
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.1)' }}>—</span>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                <Link href="/dashboard" onClick={() => setActiveSymbol(sym)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)', color: 'var(--accent-blue)', textDecoration: 'none' }}
                  title="Open chart">
                  <BarChart2 size={12} />
                </Link>
                <button onClick={e => { e.stopPropagation(); removeFromWatchlist(sym) }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, background: 'rgba(255,61,90,0.05)', border: '1px solid rgba(255,61,90,0.15)', color: 'var(--accent-red)', cursor: 'pointer' }}
                  title="Remove">
                  <X size={12} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
