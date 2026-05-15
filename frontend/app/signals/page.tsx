'use client'

import { useEffect, useState, useCallback } from 'react'
import { useTradingStore } from '@/lib/store/trading'
import { signalApi, adminApi } from '@/lib/api/client'
import { formatPrice } from '@/lib/utils/format'
import type { Signal } from '@/types/trading'
import { Zap, TrendingUp, TrendingDown, Minus, RefreshCw, Target, Shield, Brain, BarChart2 } from 'lucide-react'
import Link from 'next/link'

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
      background: 'var(--ink-850)',
      border: `1px solid rgba(${rgb},0.18)`,
      borderRadius: 12, padding: '16px',
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 9, flexShrink: 0,
            background: `rgba(${rgb},0.12)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={18} color={color} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>
              {signal.symbol.replace('USDT','')}<span style={{ color: 'var(--mute)', fontSize: 12, fontWeight: 400 }}>/USDT</span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--mute)', marginTop: 1 }}>
              {signal.timeframe} · {new Date(signal.timestamp).toLocaleTimeString()}
              {(signal as any).aiProvider && (
                <span style={{ marginLeft: 6, color: 'var(--accent-blue)' }}>
                  · AI:{(signal as any).aiProvider.toUpperCase()}
                </span>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link href="/dashboard" onClick={() => useTradingStore.getState().setActiveSymbol(signal.symbol)}
            style={{
              display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 6,
              background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)',
              color: 'var(--accent-blue)', textDecoration: 'none', fontSize: 11, fontWeight: 600,
            }}>
            <BarChart2 size={11} /> Chart
          </Link>
          <div style={{
            padding: '5px 12px', borderRadius: 6,
            background: `rgba(${rgb},0.12)`,
            border: `1px solid rgba(${rgb},0.3)`,
            color, fontSize: 12, fontWeight: 800, letterSpacing: '0.12em',
          }}>
            {signal.type}
          </div>
        </div>
      </div>

      {/* Confidence */}
      <div>
        <div style={{ fontSize: 10, color: 'var(--mute)', marginBottom: 5, letterSpacing: '0.08em' }}>AI CONFIDENCE</div>
        <ConfBar value={signal.confidence} />
      </div>

      {/* Price grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--hairline)', borderRadius: 8, padding: '9px 11px' }}>
          <div style={{ fontSize: 10, color: 'var(--mute)', marginBottom: 3 }}>Entry</div>
          <div className="num" style={{ fontSize: 13, fontWeight: 600, color: '#d7dde7' }}>${formatPrice(signal.price)}</div>
        </div>
        {signal.targetPrice && (
          <div style={{ background: 'rgba(0,255,136,0.04)', border: '1px solid rgba(0,255,136,0.12)', borderRadius: 8, padding: '9px 11px' }}>
            <div style={{ fontSize: 10, color: 'var(--mute)', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 3 }}><Target size={9} />Target</div>
            <div className="num" style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-green)' }}>${formatPrice(signal.targetPrice)}</div>
          </div>
        )}
        {signal.stopLoss && (
          <div style={{ background: 'rgba(255,61,90,0.04)', border: '1px solid rgba(255,61,90,0.12)', borderRadius: 8, padding: '9px 11px' }}>
            <div style={{ fontSize: 10, color: 'var(--mute)', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 3 }}><Shield size={9} />Stop</div>
            <div className="num" style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-red)' }}>${formatPrice(signal.stopLoss)}</div>
          </div>
        )}
      </div>

      {/* Indicators */}
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
            <span className="chip" style={{ color: signal.indicators.macd > 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
              MACD {signal.indicators.macd > 0 ? '+' : ''}{signal.indicators.macd.toFixed(2)}
            </span>
          )}
          {signal.indicators.ema20 && signal.indicators.ema50 && (
            <span className="chip">EMA20/50 {signal.indicators.ema20 > signal.indicators.ema50 ? '↑' : '↓'}</span>
          )}
        </div>
      )}

      {/* Reasoning */}
      <p style={{ fontSize: 11, color: 'var(--mute)', lineHeight: 1.6, margin: 0, paddingTop: 10, borderTop: '1px solid var(--hairline)' }}>
        {signal.reasoning}
      </p>
    </div>
  )
}

type Filter = 'ALL' | 'BUY' | 'SELL'

export default function SignalsPage() {
  const { signals, activeSymbol, setSignals, addToast } = useTradingStore()
  const [loading, setLoading]     = useState(false)
  const [filter, setFilter]       = useState<Filter>('ALL')
  const [analyzing, setAnalyzing] = useState(false)
  const [activeAi, setActiveAi]   = useState<{ provider: string; model: string } | null>(null)

  useEffect(() => {
    adminApi.getActiveProvider().then(r => {
      if (r.data.active) setActiveAi({ provider: r.data.provider, model: r.data.model })
    }).catch(() => {})
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const r = await signalApi.getSignals()
      setSignals(r.data.signals ?? [])
    } catch { /* populated via mock */ }
    finally { setLoading(false) }
  }, [setSignals])

  const analyze = async () => {
    setAnalyzing(true)
    try {
      const r = await signalApi.analyzeSymbol(activeSymbol, '15m')
      if (r.data.signal) {
        addToast({
          type: r.data.signal.type === 'BUY' ? 'buy' : r.data.signal.type === 'SELL' ? 'sell' : 'info',
          title: `${r.data.signal.type} — ${activeSymbol.replace('USDT', '/USDT')}`,
          message: `${r.data.signal.confidence}% confidence`,
        })
      }
    } catch { /* ignore */ }
    finally { setAnalyzing(false) }
  }

  useEffect(() => { refresh() }, [refresh])

  const filtered = signals.filter(s => filter === 'ALL' || s.type === filter)
  const buys  = signals.filter(s => s.type === 'BUY').length
  const sells = signals.filter(s => s.type === 'SELL').length
  const avgConf = signals.length ? Math.round(signals.reduce((a, s) => a + s.confidence, 0) / signals.length) : 0

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: '20px 24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Zap size={18} color="var(--accent-blue)" />
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>AI Signals</h1>
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', background: 'var(--accent-blue)', color: '#000', borderRadius: 4, padding: '2px 7px' }}>LIVE</span>
          {activeAi && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)' }}>
              <Brain size={11} color="var(--accent-violet)" />
              <span style={{ fontSize: 10, color: 'var(--accent-violet)', fontWeight: 600, letterSpacing: '0.04em' }}>{activeAi.provider.toUpperCase()} · {activeAi.model}</span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={analyze} disabled={analyzing} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8,
            border: '1px solid rgba(0,212,255,0.2)', background: 'rgba(0,212,255,0.06)',
            color: 'var(--accent-blue)', fontSize: 12, fontWeight: 600, cursor: analyzing ? 'wait' : 'pointer',
            opacity: analyzing ? 0.6 : 1,
          }}>
            <Zap size={12} style={{ animation: analyzing ? 'spin 0.5s linear infinite' : 'none' }} />
            {analyzing ? 'Analyzing…' : `Analyze ${activeSymbol.replace('USDT', '')}`}
          </button>
          <button onClick={refresh} disabled={loading} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36,
            borderRadius: 8, border: '1px solid var(--hairline)', background: 'rgba(255,255,255,0.03)',
            color: 'var(--mute)', cursor: 'pointer',
          }}>
            <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Total Signals', value: signals.length, color: '#d7dde7' },
          { label: 'Buy Signals',   value: buys,           color: 'var(--accent-green)' },
          { label: 'Sell Signals',  value: sells,          color: 'var(--accent-red)' },
          { label: 'Avg Confidence', value: `${avgConf}%`, color: 'var(--accent-amber)' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--ink-850)', border: '1px solid var(--hairline)', borderRadius: 10, padding: '13px 16px',
          }}>
            <div style={{ fontSize: 10, color: 'var(--mute)', letterSpacing: '0.08em', marginBottom: 6 }}>{s.label}</div>
            <div className="num" style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {(['ALL', 'BUY', 'SELL'] as Filter[]).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '6px 18px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none',
            background: filter === f ? (f === 'BUY' ? 'rgba(0,255,136,0.1)' : f === 'SELL' ? 'rgba(255,61,90,0.1)' : 'rgba(0,212,255,0.08)') : 'rgba(255,255,255,0.03)',
            color: filter === f ? (f === 'BUY' ? 'var(--accent-green)' : f === 'SELL' ? 'var(--accent-red)' : 'var(--accent-blue)') : 'var(--mute)',
            outline: filter === f ? `1px solid ${f === 'BUY' ? 'rgba(0,255,136,0.25)' : f === 'SELL' ? 'rgba(255,61,90,0.25)' : 'rgba(0,212,255,0.2)'}` : '1px solid transparent',
          }}>
            {f} {f !== 'ALL' && <span style={{ opacity: 0.7 }}>({f === 'BUY' ? buys : sells})</span>}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--mute)', alignSelf: 'center' }}>
          {filtered.length} signal{filtered.length !== 1 ? 's' : ''} · updates every 60s
        </span>
      </div>

      {/* Signal grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--mute)' }}>
          <Zap size={36} style={{ margin: '0 auto 12px', opacity: 0.2, display: 'block' }} />
          <div style={{ fontSize: 14, marginBottom: 6 }}>No {filter !== 'ALL' ? filter.toLowerCase() + ' ' : ''}signals yet</div>
          <div style={{ fontSize: 12 }}>Signal engine runs every 60 seconds</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
          {filtered.map(s => <SignalCard key={s.id} signal={s} />)}
        </div>
      )}
    </div>
  )
}
