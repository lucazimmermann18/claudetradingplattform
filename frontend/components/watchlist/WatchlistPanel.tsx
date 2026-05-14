'use client'

import { useState } from 'react'
import { useTradingStore } from '@/lib/store/trading'
import { formatPrice, formatPercent } from '@/lib/utils/format'
import { Star, Search, TrendingUp, TrendingDown, X, Plus } from 'lucide-react'

const ALL_SYMBOLS = [
  'BTCUSDT','ETHUSDT','SOLUSDT','BNBUSDT','XRPUSDT',
  'ADAUSDT','DOTUSDT','AVAXUSDT','MATICUSDT','LINKUSDT',
  'LTCUSDT','DOGEUSDT','ATOMUSDT','UNIUSDT','APTUSDT',
]

export default function WatchlistPanel() {
  const { watchlist, tickers, activeSymbol, setActiveSymbol, addToWatchlist, removeFromWatchlist, signals } = useTradingStore()
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  const items = watchlist
    .filter(s => s.toLowerCase().includes(search.toLowerCase()))
    .map(sym => ({ sym, ticker: tickers[sym], signal: signals.find(s => s.symbol === sym)?.type }))

  const toAdd = ALL_SYMBOLS.filter(s => !watchlist.includes(s))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        height: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 14px', borderBottom: '1px solid var(--hairline)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Star size={13} color="var(--accent-amber)" fill="var(--accent-amber)" />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Watchlist</span>
        </div>
        <button onClick={() => setShowAdd(v => !v)} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', fontSize: 11 }}>
          <Plus size={11} /> Add
        </button>
      </div>

      {/* Search */}
      <div style={{ padding: '7px 10px', borderBottom: '1px solid var(--hairline)', flexShrink: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(255,255,255,0.03)', border: '1px solid var(--hairline)',
          borderRadius: 6, padding: '5px 9px',
        }}>
          <Search size={11} color="var(--mute)" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
            style={{ background: 'transparent', border: 'none', outline: 'none', color: '#d7dde7', fontSize: 12, flex: 1 }} />
        </div>
      </div>

      {/* Add panel */}
      {showAdd && (
        <div style={{ padding: '7px 10px', borderBottom: '1px solid var(--hairline)', display: 'flex', flexWrap: 'wrap', gap: 4, flexShrink: 0 }}>
          {toAdd.map(sym => (
            <button key={sym} onClick={() => { addToWatchlist(sym); setShowAdd(false) }}
              className="chip" style={{ cursor: 'pointer', color: 'var(--accent-blue)', borderColor: 'rgba(0,212,255,0.2)', background: 'rgba(0,212,255,0.06)' }}>
              +{sym.replace('USDT','')}
            </button>
          ))}
        </div>
      )}

      {/* Column headers */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 80px 64px 20px',
        padding: '5px 14px 3px',
        fontSize: 10, color: 'var(--mute)', fontWeight: 600, letterSpacing: '0.08em',
        flexShrink: 0,
      }}>
        <span>PAIR</span><span style={{ textAlign: 'right' }}>PRICE</span>
        <span style={{ textAlign: 'right' }}>24H</span><span />
      </div>

      {/* Rows */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {items.map(({ sym, ticker, signal }) => {
          const active = sym === activeSymbol
          const SignIcon = signal === 'BUY' ? TrendingUp : signal === 'SELL' ? TrendingDown : null
          const sigColor = signal === 'BUY' ? 'var(--accent-green)' : 'var(--accent-red)'

          return (
            <div key={sym} onClick={() => setActiveSymbol(sym)} style={{
              display: 'grid', gridTemplateColumns: '1fr 80px 64px 20px',
              alignItems: 'center', padding: '9px 14px', cursor: 'pointer',
              background: active ? 'rgba(0,212,255,0.05)' : 'transparent',
              borderLeft: `2px solid ${active ? 'var(--accent-blue)' : 'transparent'}`,
              transition: 'all 0.12s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                {SignIcon && <SignIcon size={11} color={sigColor} style={{ flexShrink: 0 }} />}
                <div>
                  <div style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? 'var(--accent-blue)' : '#d7dde7', letterSpacing: '-0.01em' }}>
                    {sym.replace('USDT','')}
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--mute)', letterSpacing: '0.06em' }}>USDT</div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                {ticker
                  ? <span className="num" style={{ fontSize: 12, color: '#d7dde7' }}>${formatPrice(ticker.price)}</span>
                  : <span style={{ color: 'rgba(255,255,255,0.1)', fontSize: 12 }}>···</span>}
              </div>

              <div style={{ textAlign: 'right' }}>
                {ticker && (
                  <span className="num" style={{
                    fontSize: 11, fontWeight: 600,
                    color: ticker.changePercent >= 0 ? 'var(--accent-green)' : 'var(--accent-red)',
                  }}>
                    {formatPercent(ticker.changePercent)}
                  </span>
                )}
              </div>

              <button onClick={e => { e.stopPropagation(); removeFromWatchlist(sym) }}
                style={{ color: 'rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'flex-end', opacity: 0, transition: 'opacity 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0')}>
                <X size={11} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
