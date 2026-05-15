'use client'

import { useState, useMemo, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTradingStore } from '@/lib/store/trading'
import { formatPrice, formatPercent } from '@/lib/utils/format'
import { NAMES } from '@/lib/mock'
import type { Ticker } from '@/types/trading'
import { TrendingUp, TrendingDown, Zap, BarChart2, Activity } from 'lucide-react'

// ── Treemap algorithm ─────────────────────────────────────────────────────────

interface TmInput  { symbol: string; value: number }
interface TmOutput { symbol: string; x: number; y: number; w: number; h: number }

function treemap(items: TmInput[], x: number, y: number, w: number, h: number): TmOutput[] {
  if (!items.length) return []
  if (items.length === 1) return [{ symbol: items[0].symbol, x, y, w, h }]

  const total = items.reduce((s, i) => s + i.value, 0)
  let acc = 0; let split = 0
  const half = total / 2
  for (let i = 0; i < items.length; i++) {
    acc += items[i].value
    if (acc >= half) { split = i + 1; break }
  }
  split = Math.max(1, Math.min(split, items.length - 1))

  const left  = items.slice(0, split)
  const right = items.slice(split)
  const lv    = left.reduce((s, i) => s + i.value, 0)
  const ratio = lv / total

  if (w >= h) {
    const lw = w * ratio
    return [
      ...treemap(left,  x,      y, lw,      h),
      ...treemap(right, x + lw, y, w - lw,  h),
    ]
  } else {
    const lh = h * ratio
    return [
      ...treemap(left,  x, y,      w, lh),
      ...treemap(right, x, y + lh, w, h - lh),
    ]
  }
}

// ── Color helpers ─────────────────────────────────────────────────────────────

function changeStyle(pct: number, intensity: number) {
  const i = Math.min(1, Math.abs(pct) / 4) * intensity
  if (pct >= 0) return {
    bg:     `rgba(0,255,136,${0.06 + i * 0.28})`,
    border: `rgba(0,255,136,${0.18 + i * 0.45})`,
    text:   'var(--accent-green)',
    rgb:    '0,255,136',
  }
  return {
    bg:     `rgba(255,61,90,${0.06 + i * 0.28})`,
    border: `rgba(255,61,90,${0.18 + i * 0.45})`,
    text:   'var(--accent-red)',
    rgb:    '255,61,90',
  }
}

// ── Signal helpers ─────────────────────────────────────────────────────────────

type SortKey = 'volume' | 'change' | 'signal' | 'price'

import type { Signal } from '@/types/trading'

function signalForSymbol(symbol: string, signals: Signal[]) {
  return signals.find(s => s.symbol === symbol && s.type !== 'NEUTRAL') ?? null
}

// ── Tooltip ───────────────────────────────────────────────────────────────────

interface TooltipProps {
  ticker: Ticker
  signal: ReturnType<typeof signalForSymbol>
  x: number
  y: number
}

function Tooltip({ ticker, signal, x, y }: TooltipProps) {
  const rows = [
    { label: 'Price',    value: `$${formatPrice(ticker.price)}` },
    { label: '24h Chg',  value: formatPercent(ticker.changePercent), colored: true, pos: ticker.changePercent >= 0 },
    { label: '24h High', value: `$${formatPrice(ticker.high24h)}` },
    { label: '24h Low',  value: `$${formatPrice(ticker.low24h)}` },
    { label: 'Volume',   value: `$${(ticker.volume / 1e6).toFixed(1)}M` },
    ...(signal ? [{ label: 'AI Signal', value: `${signal.type} ${signal.confidence}%`, colored: true, pos: signal.type === 'BUY' }] : []),
  ]

  // Flip tooltip if too close to right/bottom edge
  const tx = x + 8
  const ty = y + 8

  return (
    <div style={{
      position: 'fixed', left: tx, top: ty, zIndex: 999,
      background: 'var(--ink-800)', border: '1px solid var(--hairline2)',
      borderRadius: 10, padding: '12px 14px', minWidth: 180,
      boxShadow: '0 16px 40px rgba(0,0,0,0.7)',
      pointerEvents: 'none',
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
        {ticker.symbol.replace('USDT', '')}<span style={{ color: 'var(--mute)', fontWeight: 400 }}>/USDT</span>
        {NAMES[ticker.symbol] && (
          <span style={{ fontSize: 10, color: 'var(--mute)', marginLeft: 6 }}>{NAMES[ticker.symbol]}</span>
        )}
      </div>
      {rows.map(r => (
        <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 20, marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: 'var(--mute)' }}>{r.label}</span>
          <span className="num" style={{
            fontSize: 11, fontWeight: 600,
            color: r.colored
              ? (r.pos ? 'var(--accent-green)' : 'var(--accent-red)')
              : '#d7dde7',
          }}>{r.value}</span>
        </div>
      ))}
    </div>
  )
}

// ── Tile ─────────────────────────────────────────────────────────────────────

interface TileProps {
  layout: TmOutput
  ticker: Ticker
  signal: ReturnType<typeof signalForSymbol>
  containerW: number
  containerH: number
  onHover: (e: React.MouseEvent, symbol: string | null) => void
  onClick: (symbol: string) => void
}

function Tile({ layout, ticker, signal, containerW, containerH, onHover, onClick }: TileProps) {
  const pct    = ticker.changePercent
  const style  = changeStyle(pct, 1)
  const pxX    = (layout.x / 100) * containerW
  const pxY    = (layout.y / 100) * containerH
  const pxW    = (layout.w / 100) * containerW
  const pxH    = (layout.h / 100) * containerH
  const tiny   = pxW < 80 || pxH < 60
  const medium = pxW >= 80 && pxW < 160
  const large  = pxW >= 250 && pxH >= 120

  const base = ticker.symbol.replace('USDT', '')

  return (
    <div
      onMouseMove={e => onHover(e, ticker.symbol)}
      onMouseLeave={e => onHover(e, null)}
      onClick={() => onClick(ticker.symbol)}
      style={{
        position: 'absolute',
        left: pxX + 2, top: pxY + 2,
        width: pxW - 4, height: pxH - 4,
        background: style.bg,
        border: `1px solid ${style.border}`,
        borderRadius: 8,
        cursor: 'pointer',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', padding: tiny ? 4 : 10,
        transition: 'filter 0.15s, transform 0.15s',
        userSelect: 'none',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.filter = 'brightness(1.18)'
        el.style.zIndex = '10'
      }}
      onMouseOut={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.filter = 'brightness(1)'
        el.style.zIndex = '1'
      }}
    >
      {/* Glow backdrop on strong moves */}
      {Math.abs(pct) >= 3 && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 8,
          boxShadow: `inset 0 0 30px rgba(${style.rgb},0.12)`,
          pointerEvents: 'none',
        }} />
      )}

      {/* Symbol */}
      <div style={{ fontSize: tiny ? 10 : medium ? 13 : large ? 22 : 16, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1 }}>
        {base}
      </div>

      {/* Name */}
      {!tiny && NAMES[ticker.symbol] && (
        <div style={{ fontSize: medium ? 9 : 10, color: 'rgba(255,255,255,0.4)', marginTop: 2, textAlign: 'center' }}>
          {NAMES[ticker.symbol]}
        </div>
      )}

      {/* Change */}
      {!tiny && (
        <div className="num" style={{
          fontSize: medium ? 11 : large ? 16 : 13, fontWeight: 700, color: style.text, marginTop: medium ? 4 : 6,
        }}>
          {pct >= 0 ? '+' : ''}{pct.toFixed(2)}%
        </div>
      )}

      {/* Price — only on non-tiny tiles */}
      {!tiny && !medium && (
        <div className="num" style={{ fontSize: large ? 13 : 11, color: 'rgba(255,255,255,0.55)', marginTop: 3 }}>
          ${formatPrice(ticker.price)}
        </div>
      )}

      {/* Signal badge */}
      {signal && !tiny && (
        <div style={{
          marginTop: 6,
          padding: '2px 8px', borderRadius: 4,
          background: signal.type === 'BUY' ? 'rgba(0,255,136,0.2)' : 'rgba(255,61,90,0.2)',
          border: `1px solid ${signal.type === 'BUY' ? 'rgba(0,255,136,0.4)' : 'rgba(255,61,90,0.4)'}`,
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          {signal.type === 'BUY'
            ? <TrendingUp size={9} color="var(--accent-green)" />
            : <TrendingDown size={9} color="var(--accent-red)" />}
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.1em',
            color: signal.type === 'BUY' ? 'var(--accent-green)' : 'var(--accent-red)' }}>
            {signal.type} {signal.confidence}%
          </span>
        </div>
      )}

      {/* Volume bar at bottom on large tiles */}
      {large && (
        <div style={{
          position: 'absolute', bottom: 8, left: 12, right: 12,
          height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 1,
        }}>
          <div style={{
            width: `${Math.min(100, (ticker.volume / 5e9) * 100)}%`,
            height: '100%', background: style.text, borderRadius: 1, opacity: 0.6,
          }} />
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

const SORT_OPTS: { key: SortKey; label: string; icon: React.ComponentType<{size?: number; color?: string}> }[] = [
  { key: 'volume',  label: 'Volume',  icon: BarChart2 },
  { key: 'change',  label: 'Change',  icon: Activity },
  { key: 'signal',  label: 'Signal',  icon: Zap },
]

export default function HeatmapPage() {
  const { tickers, signals, setActiveSymbol } = useTradingStore()
  const router = useRouter()

  const [sortBy, setSortBy] = useState<SortKey>('volume')
  const [hovered, setHovered] = useState<{ symbol: string; x: number; y: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dims, setDims] = useState({ w: 1200, h: 600 })

  // Measure container on mount + resize
  const measureRef = useCallback((el: HTMLDivElement | null) => {
    if (!el) return
    const obs = new ResizeObserver(entries => {
      const e = entries[0]
      setDims({ w: e.contentRect.width, h: e.contentRect.height })
    })
    obs.observe(el)
    setDims({ w: el.clientWidth, h: el.clientHeight })
    return () => obs.disconnect()
  }, [])

  const allSymbols = useMemo(() => Object.keys(tickers), [tickers])

  // Sort + value function
  const sorted = useMemo(() => {
    const items = allSymbols.map(sym => {
      const t = tickers[sym]
      const sig = signalForSymbol(sym, signals)
      let value = t?.volume ?? 1
      if (sortBy === 'change') value = Math.abs(t?.changePercent ?? 0) + 0.1
      if (sortBy === 'signal') value = sig ? (sig.confidence / 100) + 1 : 0.2
      return { symbol: sym, value: Math.max(value, 0.01) }
    })
    return items.sort((a, b) => b.value - a.value)
  }, [allSymbols, tickers, signals, sortBy])

  // Treemap layout (percentage-based)
  const layout = useMemo((): TmOutput[] => {
    if (!sorted.length) return []
    return treemap(sorted, 0, 0, 100, 100)
  }, [sorted])

  const handleHover = useCallback((e: React.MouseEvent, symbol: string | null) => {
    if (!symbol) { setHovered(null); return }
    setHovered({ symbol, x: e.clientX, y: e.clientY })
  }, [])

  const handleClick = useCallback((symbol: string) => {
    setActiveSymbol(symbol)
    router.push('/chart')
  }, [setActiveSymbol, router])

  const hoverTicker = hovered ? tickers[hovered.symbol] : null
  const hoverSignal = hovered ? signalForSymbol(hovered.symbol, signals) : null

  // Summary stats
  const allTickers = Object.values(tickers)
  const gainers  = allTickers.filter(t => t.changePercent > 0).length
  const losers   = allTickers.filter(t => t.changePercent < 0).length
  const avgChange = allTickers.length
    ? allTickers.reduce((s, t) => s + t.changePercent, 0) / allTickers.length
    : 0
  const signalCount = signals.filter(s => s.type !== 'NEUTRAL').length

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{
        flexShrink: 0, height: 52, display: 'flex', alignItems: 'center',
        padding: '0 16px', gap: 12, borderBottom: '1px solid var(--hairline)',
        background: 'var(--ink-900)',
      }}>
        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={15} color="var(--accent-blue)" />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Market Heatmap</span>
        </div>

        {/* Stats pills */}
        <div style={{ display: 'flex', gap: 6, marginLeft: 8 }}>
          <div style={{ padding: '3px 10px', borderRadius: 5, background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)' }}>
            <span className="num" style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-green)' }}>▲ {gainers}</span>
            <span style={{ fontSize: 10, color: 'var(--mute)', marginLeft: 4 }}>gainers</span>
          </div>
          <div style={{ padding: '3px 10px', borderRadius: 5, background: 'rgba(255,61,90,0.08)', border: '1px solid rgba(255,61,90,0.2)' }}>
            <span className="num" style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-red)' }}>▼ {losers}</span>
            <span style={{ fontSize: 10, color: 'var(--mute)', marginLeft: 4 }}>losers</span>
          </div>
          <div style={{ padding: '3px 10px', borderRadius: 5, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--hairline)' }}>
            <span className="num" style={{ fontSize: 11, fontWeight: 700, color: avgChange >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
              {avgChange >= 0 ? '+' : ''}{avgChange.toFixed(2)}%
            </span>
            <span style={{ fontSize: 10, color: 'var(--mute)', marginLeft: 4 }}>avg</span>
          </div>
          {signalCount > 0 && (
            <div style={{ padding: '3px 10px', borderRadius: 5, background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.2)' }}>
              <span className="num" style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-blue)' }}>{signalCount}</span>
              <span style={{ fontSize: 10, color: 'var(--mute)', marginLeft: 4 }}>AI signals</span>
            </div>
          )}
        </div>

        {/* Sort */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 10, color: 'var(--mute)', letterSpacing: '0.08em', marginRight: 4 }}>SIZE BY</span>
          {SORT_OPTS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setSortBy(key)} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
              background: sortBy === key ? 'rgba(0,212,255,0.1)' : 'transparent',
              border: sortBy === key ? '1px solid rgba(0,212,255,0.25)' : '1px solid var(--hairline)',
              color: sortBy === key ? 'var(--accent-blue)' : 'var(--mute)',
              transition: 'all 0.15s',
            }}>
              <Icon size={11} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Colour legend */}
      <div style={{
        flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8,
        padding: '6px 16px', borderBottom: '1px solid var(--hairline)',
        background: 'var(--ink-950)',
      }}>
        <span style={{ fontSize: 9, color: 'var(--mute)', letterSpacing: '0.1em' }}>CHANGE %</span>
        {[-4, -3, -2, -1, 0, 1, 2, 3, 4].map(v => {
          const s = changeStyle(v, 1)
          return (
            <div key={v} style={{
              display: 'flex', alignItems: 'center', gap: 3,
              padding: '2px 8px', borderRadius: 4,
              background: s.bg, border: `1px solid ${s.border}`,
            }}>
              <span className="num" style={{ fontSize: 9, color: s.text, fontWeight: 600 }}>
                {v > 0 ? '+' : ''}{v}%
              </span>
            </div>
          )
        })}
        <span style={{ fontSize: 9, color: 'var(--mute)', marginLeft: 8 }}>
          Click any tile → open chart · Hover → details
        </span>
      </div>

      {/* Treemap */}
      <div
        ref={el => { measureRef(el); (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = el }}
        style={{ flex: 1, position: 'relative', overflow: 'hidden', background: 'var(--ink-950)' }}
      >
        {layout.map(node => {
          const ticker = tickers[node.symbol]
          if (!ticker) return null
          const sig = signalForSymbol(node.symbol, signals)
          return (
            <Tile
              key={node.symbol}
              layout={node}
              ticker={ticker}
              signal={sig}
              containerW={dims.w}
              containerH={dims.h}
              onHover={handleHover}
              onClick={handleClick}
            />
          )
        })}

        {/* Empty state */}
        {!allSymbols.length && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--mute)', fontSize: 13 }}>
            Loading market data…
          </div>
        )}
      </div>

      {/* Tooltip */}
      {hovered && hoverTicker && (
        <Tooltip
          ticker={hoverTicker}
          signal={hoverSignal}
          x={hovered.x}
          y={hovered.y}
        />
      )}
    </div>
  )
}
