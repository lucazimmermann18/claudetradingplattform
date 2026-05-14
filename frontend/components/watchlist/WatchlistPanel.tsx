'use client'

import { useState } from 'react'
import { useTradingStore } from '@/lib/store/trading'
import { formatPrice, formatPercent } from '@/lib/utils/format'
import { Star, Search, TrendingUp, TrendingDown, Minus, X, Plus } from 'lucide-react'

const AVAILABLE = [
  'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT',
  'ADAUSDT', 'DOTUSDT', 'AVAXUSDT', 'MATICUSDT', 'LINKUSDT',
  'LTCUSDT', 'DOGEUSDT', 'ATOMUSDT', 'UNIUSDT', 'APTUSDT',
]

export default function WatchlistPanel() {
  const { watchlist, tickers, activeSymbol, setActiveSymbol, addToWatchlist, removeFromWatchlist, signals } = useTradingStore()
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  const items = watchlist.map((sym) => ({
    symbol: sym,
    ticker: tickers[sym],
    signal: signals.find((s) => s.symbol === sym)?.type,
  }))

  const filtered = items.filter((item) =>
    item.symbol.toLowerCase().includes(search.toLowerCase())
  )

  const toAdd = AVAILABLE.filter((s) => !watchlist.includes(s))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px', borderBottom: '1px solid #1e2d40',
        display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
      }}>
        <Star size={16} color="#ffd32a" fill="#ffd32a" />
        <span style={{ fontSize: 14, fontWeight: 700, color: '#e8edf5' }}>Watchlist</span>
        <button
          onClick={() => setShowAdd(!showAdd)}
          style={{
            marginLeft: 'auto', background: 'transparent',
            border: '1px solid #1e2d40', borderRadius: 6,
            padding: '3px 8px', color: '#7a8da8', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4, fontSize: 11,
          }}
        >
          <Plus size={11} /> Add
        </button>
      </div>

      {/* Search */}
      <div style={{ padding: '8px 12px', borderBottom: '1px solid #1e2d40', flexShrink: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: '#111827', border: '1px solid #1e2d40',
          borderRadius: 8, padding: '6px 10px',
        }}>
          <Search size={13} color="#4a5568" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            style={{
              background: 'transparent', border: 'none', outline: 'none',
              color: '#e8edf5', fontSize: 12, flex: 1,
            }}
          />
        </div>
      </div>

      {/* Add symbols dropdown */}
      {showAdd && (
        <div style={{
          padding: '8px 12px', borderBottom: '1px solid #1e2d40',
          display: 'flex', flexWrap: 'wrap', gap: 4, flexShrink: 0,
        }}>
          {toAdd.map((sym) => (
            <button
              key={sym}
              onClick={() => { addToWatchlist(sym); setShowAdd(false) }}
              style={{
                background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)',
                borderRadius: 4, padding: '2px 8px', color: '#00d4ff',
                fontSize: 11, fontWeight: 600, cursor: 'pointer',
              }}
            >
              + {sym.replace('USDT', '')}
            </button>
          ))}
        </div>
      )}

      {/* Column headers */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 80px 70px 24px',
        padding: '6px 16px 4px',
        fontSize: 10, color: '#4a5568', fontWeight: 600, letterSpacing: '0.5px',
        flexShrink: 0,
      }}>
        <span>SYMBOL</span>
        <span style={{ textAlign: 'right' }}>PRICE</span>
        <span style={{ textAlign: 'right' }}>24H</span>
        <span />
      </div>

      {/* List */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {filtered.map(({ symbol, ticker, signal }) => {
          const active = symbol === activeSymbol
          const SignalIcon = signal === 'BUY' ? TrendingUp : signal === 'SELL' ? TrendingDown : null
          const signalColor = signal === 'BUY' ? '#00ff88' : signal === 'SELL' ? '#ff4757' : '#7a8da8'

          return (
            <div
              key={symbol}
              onClick={() => setActiveSymbol(symbol)}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 80px 70px 24px',
                alignItems: 'center',
                padding: '10px 16px',
                cursor: 'pointer',
                background: active ? 'rgba(0,212,255,0.06)' : 'transparent',
                borderLeft: active ? '2px solid #00d4ff' : '2px solid transparent',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {SignalIcon && <SignalIcon size={12} color={signalColor} />}
                <div>
                  <div style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? '#00d4ff' : '#e8edf5' }}>
                    {symbol.replace('USDT', '')}
                  </div>
                  <div style={{ fontSize: 10, color: '#4a5568' }}>USDT</div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                {ticker ? (
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#e8edf5' }}>
                    ${formatPrice(ticker.price)}
                  </div>
                ) : (
                  <div style={{ fontSize: 11, color: '#1e2d40' }}>...</div>
                )}
              </div>

              <div style={{ textAlign: 'right' }}>
                {ticker ? (
                  <div style={{
                    fontSize: 11, fontWeight: 600,
                    color: ticker.changePercent >= 0 ? '#00ff88' : '#ff4757',
                  }}>
                    {formatPercent(ticker.changePercent)}
                  </div>
                ) : null}
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); removeFromWatchlist(symbol) }}
                style={{
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: '#1e2d40', padding: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: 0, transition: 'opacity 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
              >
                <X size={12} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
