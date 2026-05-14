'use client'

import { useState, useCallback } from 'react'
import { useTradingStore } from '@/lib/store/trading'
import { formatPrice, formatPercent, getChangeClass } from '@/lib/utils/format'
import { Search, Bell, Settings, ChevronDown } from 'lucide-react'

const POPULAR = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'DOTUSDT', 'AVAXUSDT']

export default function TopBar() {
  const { activeSymbol, setActiveSymbol, tickers, connected } = useTradingStore()
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')

  const ticker = tickers[activeSymbol]

  const filtered = query
    ? POPULAR.filter((s) => s.toLowerCase().includes(query.toLowerCase()))
    : POPULAR

  const handleSelect = useCallback((symbol: string) => {
    setActiveSymbol(symbol)
    setSearchOpen(false)
    setQuery('')
  }, [setActiveSymbol])

  return (
    <div style={{
      height: 56,
      background: '#0d1117',
      borderBottom: '1px solid #1e2d40',
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      gap: 20,
      flexShrink: 0,
    }}>
      {/* Symbol selector */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#111827',
            border: '1px solid #1e2d40',
            borderRadius: 8, padding: '6px 12px',
            color: '#e8edf5', cursor: 'pointer',
            fontSize: 14, fontWeight: 600,
          }}
        >
          <span style={{ color: '#00d4ff' }}>{activeSymbol.replace('USDT', '')}</span>
          <span style={{ color: '#4a5568', fontSize: 11 }}>/USDT</span>
          <ChevronDown size={14} color="#7a8da8" />
        </button>

        {searchOpen && (
          <div style={{
            position: 'absolute', top: '110%', left: 0,
            background: '#0f1623', border: '1px solid #1e2d40',
            borderRadius: 10, padding: 8, zIndex: 100, width: 220,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, padding: '0 4px' }}>
              <Search size={14} color="#4a5568" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search symbol..."
                style={{
                  background: 'transparent', border: 'none', outline: 'none',
                  color: '#e8edf5', fontSize: 13, flex: 1,
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {filtered.map((sym) => {
                const t = tickers[sym]
                return (
                  <button
                    key={sym}
                    onClick={() => handleSelect(sym)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 8px', borderRadius: 6, cursor: 'pointer',
                      background: sym === activeSymbol ? 'rgba(0,212,255,0.08)' : 'transparent',
                      border: 'none', color: '#e8edf5', width: '100%', textAlign: 'left',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>
                        {sym.replace('USDT', '')}<span style={{ color: '#4a5568', fontSize: 11 }}>/USDT</span>
                      </div>
                    </div>
                    {t && (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>${formatPrice(t.price)}</div>
                        <div style={{ fontSize: 11, color: t.changePercent >= 0 ? '#00ff88' : '#ff4757' }}>
                          {formatPercent(t.changePercent)}
                        </div>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Price info */}
      {ticker ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div>
            <span style={{ fontSize: 20, fontWeight: 700, color: '#e8edf5' }}>
              ${formatPrice(ticker.price)}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
            <div>
              <div style={{ color: '#4a5568', marginBottom: 1 }}>24h Change</div>
              <div style={{ color: ticker.changePercent >= 0 ? '#00ff88' : '#ff4757', fontWeight: 600 }}>
                {formatPercent(ticker.changePercent)}
              </div>
            </div>
            <div>
              <div style={{ color: '#4a5568', marginBottom: 1 }}>24h High</div>
              <div style={{ color: '#e8edf5', fontWeight: 500 }}>${formatPrice(ticker.high24h)}</div>
            </div>
            <div>
              <div style={{ color: '#4a5568', marginBottom: 1 }}>24h Low</div>
              <div style={{ color: '#e8edf5', fontWeight: 500 }}>${formatPrice(ticker.low24h)}</div>
            </div>
            <div>
              <div style={{ color: '#4a5568', marginBottom: 1 }}>Volume</div>
              <div style={{ color: '#e8edf5', fontWeight: 500 }}>
                {(ticker.volume / 1e6).toFixed(1)}M
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 13, color: '#4a5568' }}>Loading market data...</div>
      )}

      {/* Right side */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Live indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: connected ? '#00ff88' : '#ff4757',
            boxShadow: connected ? '0 0 8px #00ff88' : 'none',
          }} />
          <span style={{ fontSize: 11, color: '#4a5568', fontWeight: 500, letterSpacing: '0.5px' }}>
            {connected ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>

        <button style={{
          background: 'transparent', border: '1px solid #1e2d40',
          borderRadius: 8, padding: '6px 8px', cursor: 'pointer', color: '#7a8da8',
          display: 'flex', alignItems: 'center',
        }}>
          <Bell size={16} />
        </button>
      </div>
    </div>
  )
}
