'use client'

import { useState, useCallback, useEffect } from 'react'
import { useTradingStore } from '@/lib/store/trading'
import { formatPrice, formatPercent } from '@/lib/utils/format'
import { Search, ChevronDown, Bell } from 'lucide-react'
import { SESSIONS, getOpenSessions, sessionProgress } from '@/lib/utils/sessions'

const SYMBOLS = ['BTCUSDT','ETHUSDT','SOLUSDT','BNBUSDT','XRPUSDT','ADAUSDT','DOTUSDT','AVAXUSDT','LINKUSDT','LTCUSDT']

export default function TopBar() {
  const { activeSymbol, setActiveSymbol, tickers, connected } = useTradingStore()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')

  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  const ticker = tickers[activeSymbol]
  const base = activeSymbol.replace('USDT','')
  const filtered = q ? SYMBOLS.filter(s => s.includes(q.toUpperCase())) : SYMBOLS
  const openSessions = getOpenSessions(now)

  const select = useCallback((s: string) => { setActiveSymbol(s); setOpen(false); setQ('') }, [setActiveSymbol])

  return (
    <header style={{
      height: 56, flexShrink: 0,
      background: 'var(--ink-900)',
      borderBottom: '1px solid var(--hairline)',
      display: 'flex', alignItems: 'center', gap: 20, padding: '0 20px',
    }}>
      {/* Symbol picker */}
      <div style={{ position: 'relative' }}>
        <button onClick={() => setOpen(v => !v)} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(255,255,255,0.03)', border: '1px solid var(--hairline2)',
          borderRadius: 7, padding: '6px 12px', cursor: 'pointer',
        }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>{base}</span>
          <span style={{ fontSize: 11, color: 'var(--mute)' }}>/USDT</span>
          <ChevronDown size={13} color="var(--mute)" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>

        {open && (
          <div style={{
            position: 'absolute', top: '110%', left: 0, zIndex: 50,
            background: 'var(--ink-850)', border: '1px solid var(--hairline2)',
            borderRadius: 10, width: 230, padding: 8,
            boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: 'rgba(255,255,255,0.03)', border: '1px solid var(--hairline)',
              borderRadius: 6, padding: '6px 10px', marginBottom: 6,
            }}>
              <Search size={12} color="var(--mute)" />
              <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search…"
                style={{ background: 'transparent', border: 'none', outline: 'none', color: '#d7dde7', fontSize: 12, flex: 1 }} />
            </div>
            {filtered.map(sym => {
              const t = tickers[sym]
              const isActive = sym === activeSymbol
              return (
                <button key={sym} onClick={() => select(sym)} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', padding: '8px 10px', borderRadius: 6, cursor: 'pointer',
                  background: isActive ? 'rgba(0,212,255,0.07)' : 'transparent',
                  border: 'none', textAlign: 'left',
                  transition: 'background 0.12s',
                }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: isActive ? 'var(--accent-blue)' : '#d7dde7' }}>
                    {sym.replace('USDT','')}<span style={{ color: 'var(--mute)', fontSize: 11 }}>/USDT</span>
                  </span>
                  {t && (
                    <div style={{ textAlign: 'right' }}>
                      <div className="num" style={{ fontSize: 12, color: '#d7dde7' }}>${formatPrice(t.price)}</div>
                      <div style={{ fontSize: 10, color: t.changePercent >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                        {formatPercent(t.changePercent)}
                      </div>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Price strip */}
      {ticker ? (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 20 }}>
          <span className="num" style={{ fontSize: 20, fontWeight: 600, color: '#fff', letterSpacing: '-0.03em' }}>
            ${formatPrice(ticker.price)}
          </span>
          {[
            { label: '24h', value: formatPercent(ticker.changePercent), positive: ticker.changePercent >= 0 },
            { label: 'High', value: `$${formatPrice(ticker.high24h)}` },
            { label: 'Low',  value: `$${formatPrice(ticker.low24h)}` },
            { label: 'Vol',  value: `${(ticker.volume / 1e6).toFixed(1)}M` },
          ].map(({ label, value, positive }) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <span style={{ fontSize: 10, color: 'var(--mute)', letterSpacing: '0.08em' }}>{label}</span>
              <span className="num" style={{
                fontSize: 12, fontWeight: 500,
                color: positive !== undefined
                  ? (positive ? 'var(--accent-green)' : 'var(--accent-red)')
                  : '#d7dde7',
              }}>{value}</span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className="skeleton" style={{ width: 100, height: 22, borderRadius: 5 }} />
          <div className="skeleton" style={{ width: 50, height: 14, borderRadius: 5 }} />
          <div className="skeleton" style={{ width: 70, height: 14, borderRadius: 5 }} />
          <div className="skeleton" style={{ width: 70, height: 14, borderRadius: 5 }} />
        </div>
      )}

      {/* Session indicators */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 'auto' }}>
        {SESSIONS.map(s => {
          const isOpen = openSessions.some(o => o.name === s.name)
          const prog = isOpen ? sessionProgress(s, now) : 0
          return (
            <div key={s.name} title={`${s.name} session${isOpen ? ` — ${Math.round(prog * 100)}% complete` : ' (closed)'}`} style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 5,
              background: isOpen ? `rgba(${s.rgb},0.08)` : 'transparent',
              border: `1px solid ${isOpen ? `rgba(${s.rgb},0.22)` : 'rgba(255,255,255,0.05)'}`,
              transition: 'all 0.3s',
              position: 'relative', overflow: 'hidden',
            }}>
              {isOpen && (
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0,
                  width: `${prog * 100}%`,
                  background: `rgba(${s.rgb},0.06)`,
                  transition: 'width 1s linear',
                }} />
              )}
              <span style={{
                width: 5, height: 5, borderRadius: '50%', flexShrink: 0, position: 'relative',
                background: isOpen ? `rgb(${s.rgb})` : 'rgba(255,255,255,0.15)',
                boxShadow: isOpen ? `0 0 6px rgb(${s.rgb})` : 'none',
              }} />
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', position: 'relative',
                color: isOpen ? `rgb(${s.rgb})` : 'var(--mute)',
              }}>{s.short}</span>
            </div>
          )
        })}
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span className="dot" style={{
            background: connected ? 'var(--accent-green)' : 'var(--accent-red)',
            boxShadow: connected ? '0 0 8px var(--accent-green)' : 'none',
          }} />
          <span style={{ fontSize: 10, color: 'var(--mute)', letterSpacing: '0.1em', fontWeight: 600 }}>
            {connected ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>
        <button className="btn-ghost" style={{ padding: '5px 8px' }}>
          <Bell size={14} />
        </button>
      </div>
    </header>
  )
}
