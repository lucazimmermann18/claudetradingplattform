'use client'

import { useEffect, useState } from 'react'
import { useTradingStore } from '@/lib/store/trading'
import { signalApi } from '@/lib/api/client'
import { formatPrice } from '@/lib/utils/format'
import type { Signal } from '@/types/trading'
import { Zap, TrendingUp, TrendingDown, Minus, RefreshCw, Target, Shield } from 'lucide-react'
import { SkeletonSignalCard } from '@/components/ui/Skeleton'

function ConfBar({ value }: { value: number }) {
  const color = value >= 75 ? 'var(--accent-green)' : value >= 50 ? 'var(--accent-amber)' : 'var(--accent-red)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: 999, transition: 'width 0.5s ease' }} />
      </div>
      <span className="num" style={{ fontSize: 11, color, fontWeight: 600, minWidth: 32 }}>{value}%</span>
    </div>
  )
}

function SignalCard({ signal }: { signal: Signal }) {
  const isBuy  = signal.type === 'BUY'
  const isSell = signal.type === 'SELL'
  const color  = isBuy ? 'var(--accent-green)' : isSell ? 'var(--accent-red)' : 'var(--mute)'
  const Icon   = isBuy ? TrendingUp : isSell ? TrendingDown : Minus
  const rgb    = isBuy ? '0,255,136' : isSell ? '255,61,90' : '90,103,121'

  return (
    <div className="animate-riseIn" style={{
      background: 'var(--ink-800)',
      border: `1px solid rgba(${rgb},0.18)`,
      borderRadius: 10, padding: '14px',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8, flexShrink: 0,
            background: `rgba(${rgb},0.12)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={16} color={color} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>
              {signal.symbol.replace('USDT','')}<span style={{ color: 'var(--mute)', fontSize: 11, fontWeight: 400 }}>/USDT</span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--mute)', marginTop: 1 }}>
              {signal.timeframe} · {new Date(signal.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
        <div style={{
          padding: '4px 11px', borderRadius: 5,
          background: `rgba(${rgb},0.12)`,
          border: `1px solid rgba(${rgb},0.3)`,
          color, fontSize: 11, fontWeight: 800, letterSpacing: '0.12em',
        }}>
          {signal.type}
        </div>
      </div>

      {/* Confidence */}
      <div>
        <div style={{ fontSize: 10, color: 'var(--mute)', marginBottom: 5, letterSpacing: '0.08em' }}>AI CONFIDENCE</div>
        <ConfBar value={signal.confidence} />
      </div>

      {/* Price grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--hairline)', borderRadius: 7, padding: '8px 10px' }}>
          <div style={{ fontSize: 10, color: 'var(--mute)', marginBottom: 3 }}>Entry</div>
          <div className="num" style={{ fontSize: 13, fontWeight: 600, color: '#d7dde7' }}>${formatPrice(signal.price)}</div>
        </div>
        {signal.targetPrice && (
          <div style={{ background: 'rgba(0,255,136,0.04)', border: '1px solid rgba(0,255,136,0.12)', borderRadius: 7, padding: '8px 10px' }}>
            <div style={{ fontSize: 10, color: 'var(--mute)', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 3 }}><Target size={9} />Target</div>
            <div className="num" style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-green)' }}>${formatPrice(signal.targetPrice)}</div>
          </div>
        )}
        {signal.stopLoss && (
          <div style={{ background: 'rgba(255,61,90,0.04)', border: '1px solid rgba(255,61,90,0.12)', borderRadius: 7, padding: '8px 10px' }}>
            <div style={{ fontSize: 10, color: 'var(--mute)', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 3 }}><Shield size={9} />Stop</div>
            <div className="num" style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-red)' }}>${formatPrice(signal.stopLoss)}</div>
          </div>
        )}
      </div>

      {/* Indicator chips */}
      {signal.indicators && (
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {signal.indicators.rsi !== undefined && (
            <span className="chip" style={{
              background: signal.indicators.rsi < 30 ? 'rgba(0,255,136,0.08)' : signal.indicators.rsi > 70 ? 'rgba(255,61,90,0.08)' : undefined,
              borderColor: signal.indicators.rsi < 30 ? 'rgba(0,255,136,0.25)' : signal.indicators.rsi > 70 ? 'rgba(255,61,90,0.25)' : undefined,
              color: signal.indicators.rsi < 30 ? 'var(--accent-green)' : signal.indicators.rsi > 70 ? 'var(--accent-red)' : undefined,
            }}>
              RSI {signal.indicators.rsi.toFixed(1)}
            </span>
          )}
          {signal.indicators.macd !== undefined && (
            <span className="chip" style={{
              color: (signal.indicators.macd ?? 0) > 0 ? 'var(--accent-green)' : 'var(--accent-red)',
            }}>
              MACD {signal.indicators.macd > 0 ? '+' : ''}{signal.indicators.macd.toFixed(2)}
            </span>
          )}
        </div>
      )}

      {/* Reasoning */}
      <p style={{ fontSize: 11, color: 'var(--mute)', lineHeight: 1.55, margin: 0, paddingTop: 8, borderTop: '1px solid var(--hairline)' }}>
        {signal.reasoning}
      </p>
    </div>
  )
}

export default function SignalPanel() {
  const { signals, activeSymbol, setSignals } = useTradingStore()
  const [loading, setLoading] = useState(signals.length === 0)
  const [filter, setFilter]   = useState<'ALL' | 'BUY' | 'SELL'>('ALL')

  const fetch = async () => {
    setLoading(true)
    try { const r = await signalApi.getSignals(); setSignals(r.data.signals || []) }
    catch { /* populated via WS */ }
    finally { setLoading(false) }
  }

  const analyze = async () => {
    setLoading(true)
    try { await signalApi.analyzeSymbol(activeSymbol, '15m') }
    catch { /* ignore */ }
    finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [])

  const filtered = signals.filter(s => filter === 'ALL' || s.type === filter)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 14px', height: 44,
        borderBottom: '1px solid var(--hairline)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Zap size={14} color="var(--accent-blue)" />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>AI Signals</span>
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
            background: 'var(--accent-blue)', color: 'var(--ink-950)',
            borderRadius: 3, padding: '1px 5px',
          }}>LIVE</span>
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          <button onClick={analyze} style={{
            background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)',
            borderRadius: 5, padding: '4px 10px', color: 'var(--accent-blue)',
            fontSize: 11, fontWeight: 600, cursor: 'pointer',
          }}>
            Analyze {activeSymbol.replace('USDT','')}
          </button>
          <button onClick={fetch} className="btn-ghost" style={{
            display: 'flex', alignItems: 'center', padding: '4px 7px',
          }}>
            <RefreshCw size={12} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4, padding: '7px 14px',
        borderBottom: '1px solid var(--hairline)', flexShrink: 0,
      }}>
        {(['ALL','BUY','SELL'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '3px 12px', borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: 'pointer',
            background: filter === f ? (f === 'BUY' ? 'rgba(0,255,136,0.1)' : f === 'SELL' ? 'rgba(255,61,90,0.1)' : 'rgba(0,212,255,0.08)') : 'transparent',
            border: filter === f ? `1px solid ${f === 'BUY' ? 'rgba(0,255,136,0.25)' : f === 'SELL' ? 'rgba(255,61,90,0.25)' : 'rgba(0,212,255,0.2)'}` : '1px solid transparent',
            color: filter === f ? (f === 'BUY' ? 'var(--accent-green)' : f === 'SELL' ? 'var(--accent-red)' : 'var(--accent-blue)') : 'var(--mute)',
          }}>{f}</button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--mute)' }}>{filtered.length} signals</span>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflow: 'auto', padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading ? (
          <>
            <SkeletonSignalCard />
            <SkeletonSignalCard />
          </>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--mute)' }}>
            <Zap size={28} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
            <div style={{ fontSize: 13 }}>No signals yet</div>
            <div style={{ fontSize: 11, marginTop: 4 }}>Engine runs every 60 seconds</div>
          </div>
        ) : filtered.map(s => <SignalCard key={s.id} signal={s} />)}
      </div>
    </div>
  )
}
