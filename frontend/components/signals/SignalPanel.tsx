'use client'

import { useEffect, useState } from 'react'
import { useTradingStore } from '@/lib/store/trading'
import { signalApi } from '@/lib/api/client'
import { formatPrice, formatPercent } from '@/lib/utils/format'
import type { Signal } from '@/types/trading'
import { Zap, TrendingUp, TrendingDown, Minus, RefreshCw, Target, Shield } from 'lucide-react'

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 75 ? '#00ff88' : value >= 50 ? '#ffd32a' : '#ff4757'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 4, background: '#1e2d40', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.5s ease' }} />
      </div>
      <span style={{ fontSize: 11, color, fontWeight: 700, minWidth: 32 }}>{value}%</span>
    </div>
  )
}

function SignalCard({ signal }: { signal: Signal }) {
  const isBuy = signal.type === 'BUY'
  const isSell = signal.type === 'SELL'
  const color = isBuy ? '#00ff88' : isSell ? '#ff4757' : '#7a8da8'
  const Icon = isBuy ? TrendingUp : isSell ? TrendingDown : Minus

  return (
    <div style={{
      background: '#111827',
      border: `1px solid ${isBuy ? 'rgba(0,255,136,0.2)' : isSell ? 'rgba(255,71,87,0.2)' : '#1e2d40'}`,
      borderRadius: 10,
      padding: '14px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      animation: 'slide-up 0.3s ease',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: `rgba(${isBuy ? '0,255,136' : isSell ? '255,71,87' : '122,141,168'},0.15)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={16} color={color} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#e8edf5' }}>
              {signal.symbol.replace('USDT', '')}
              <span style={{ color: '#4a5568', fontSize: 11 }}>/USDT</span>
            </div>
            <div style={{ fontSize: 10, color: '#4a5568' }}>{signal.timeframe} • {new Date(signal.timestamp).toLocaleTimeString()}</div>
          </div>
        </div>
        <div style={{
          padding: '4px 12px',
          borderRadius: 6,
          background: `rgba(${isBuy ? '0,255,136' : isSell ? '255,71,87' : '122,141,168'},0.15)`,
          border: `1px solid ${color}44`,
          color,
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: '1px',
        }}>
          {signal.type}
        </div>
      </div>

      {/* Confidence */}
      <div>
        <div style={{ fontSize: 11, color: '#4a5568', marginBottom: 4 }}>AI Confidence</div>
        <ConfidenceBar value={signal.confidence} />
      </div>

      {/* Price info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div style={{ background: '#0f1623', borderRadius: 6, padding: '8px 10px' }}>
          <div style={{ fontSize: 10, color: '#4a5568', marginBottom: 2 }}>Entry Price</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#e8edf5' }}>${formatPrice(signal.price)}</div>
        </div>
        {signal.targetPrice && (
          <div style={{ background: '#0f1623', borderRadius: 6, padding: '8px 10px' }}>
            <div style={{ fontSize: 10, color: '#4a5568', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Target size={9} /> Target
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#00ff88' }}>${formatPrice(signal.targetPrice)}</div>
          </div>
        )}
        {signal.stopLoss && (
          <div style={{ background: '#0f1623', borderRadius: 6, padding: '8px 10px' }}>
            <div style={{ fontSize: 10, color: '#4a5568', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Shield size={9} /> Stop Loss
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#ff4757' }}>${formatPrice(signal.stopLoss)}</div>
          </div>
        )}
      </div>

      {/* Indicators row */}
      {signal.indicators && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {signal.indicators.rsi !== undefined && (
            <span style={{
              fontSize: 10, padding: '2px 8px', borderRadius: 4,
              background: signal.indicators.rsi < 30 ? 'rgba(0,255,136,0.1)' : signal.indicators.rsi > 70 ? 'rgba(255,71,87,0.1)' : 'rgba(122,141,168,0.1)',
              color: signal.indicators.rsi < 30 ? '#00ff88' : signal.indicators.rsi > 70 ? '#ff4757' : '#7a8da8',
              border: '1px solid rgba(122,141,168,0.1)',
              fontWeight: 600,
            }}>
              RSI {signal.indicators.rsi.toFixed(1)}
            </span>
          )}
          {signal.indicators.macd !== undefined && (
            <span style={{
              fontSize: 10, padding: '2px 8px', borderRadius: 4,
              background: (signal.indicators.macd ?? 0) > 0 ? 'rgba(0,255,136,0.1)' : 'rgba(255,71,87,0.1)',
              color: (signal.indicators.macd ?? 0) > 0 ? '#00ff88' : '#ff4757',
              border: '1px solid rgba(122,141,168,0.1)',
              fontWeight: 600,
            }}>
              MACD {signal.indicators.macd.toFixed(2)}
            </span>
          )}
        </div>
      )}

      {/* Reasoning */}
      <div style={{ fontSize: 11, color: '#7a8da8', lineHeight: 1.5, borderTop: '1px solid #1e2d40', paddingTop: 8 }}>
        {signal.reasoning}
      </div>
    </div>
  )
}

export default function SignalPanel() {
  const { signals, activeSymbol, setSignals } = useTradingStore()
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'ALL' | 'BUY' | 'SELL'>('ALL')

  const fetchSignals = async () => {
    setLoading(true)
    try {
      const res = await signalApi.getSignals()
      setSignals(res.data.signals || [])
    } catch {
      // signals will be populated via WebSocket
    } finally {
      setLoading(false)
    }
  }

  const analyzeActive = async () => {
    setLoading(true)
    try {
      const res = await signalApi.analyzeSymbol(activeSymbol, '15m')
      // Signal will arrive via WebSocket or be returned here
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSignals() }, [])

  const filtered = signals.filter((s) => filter === 'ALL' || s.type === filter)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #1e2d40',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Zap size={16} color="#00d4ff" />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#e8edf5' }}>AI Signals</span>
          <span style={{
            background: '#00d4ff', color: '#000',
            fontSize: 10, fontWeight: 700,
            padding: '1px 6px', borderRadius: 4,
          }}>LIVE</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={analyzeActive} style={{
            background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)',
            borderRadius: 6, padding: '4px 10px', color: '#00d4ff',
            fontSize: 11, fontWeight: 600, cursor: 'pointer',
          }}>
            Analyze {activeSymbol.replace('USDT', '')}
          </button>
          <button onClick={fetchSignals} style={{
            background: 'transparent', border: '1px solid #1e2d40',
            borderRadius: 6, padding: '4px 8px', color: '#7a8da8',
            cursor: 'pointer', display: 'flex', alignItems: 'center',
          }}>
            <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 4, padding: '8px 12px', borderBottom: '1px solid #1e2d40', flexShrink: 0 }}>
        {(['ALL', 'BUY', 'SELL'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
              background: filter === f ? (f === 'BUY' ? 'rgba(0,255,136,0.15)' : f === 'SELL' ? 'rgba(255,71,87,0.15)' : 'rgba(0,212,255,0.1)') : 'transparent',
              border: filter === f ? `1px solid ${f === 'BUY' ? '#00ff8844' : f === 'SELL' ? '#ff475744' : '#00d4ff44'}` : '1px solid transparent',
              color: filter === f ? (f === 'BUY' ? '#00ff88' : f === 'SELL' ? '#ff4757' : '#00d4ff') : '#4a5568',
            }}
          >
            {f}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#4a5568', alignSelf: 'center' }}>
          {filtered.length} signals
        </span>
      </div>

      {/* Signal list */}
      <div style={{ flex: 1, overflow: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#4a5568' }}>
            <Zap size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <div style={{ fontSize: 13 }}>No signals yet</div>
            <div style={{ fontSize: 11, marginTop: 4 }}>The AI engine will generate signals automatically</div>
          </div>
        ) : (
          filtered.map((signal) => <SignalCard key={signal.id} signal={signal} />)
        )}
      </div>
    </div>
  )
}
