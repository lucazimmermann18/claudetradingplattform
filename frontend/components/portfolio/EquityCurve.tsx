'use client'

import { useMemo } from 'react'
import { useTradingStore } from '@/lib/store/trading'

export default function EquityCurve() {
  const equityHistory = useTradingStore(s => s.equityHistory)
  const portfolioStats = useTradingStore(s => s.portfolioStats)

  // While we have < 2 real equity points, synthesise a demo curve from mock stats
  const points = useMemo(() => {
    if (equityHistory.length >= 2) return equityHistory

    // Generate a plausible 24h equity walk for demo purposes
    const baseValue = portfolioStats?.totalValue ?? 145_000
    const now = Math.floor(Date.now() / 1000)
    const pts: { time: number; value: number }[] = []
    let v = baseValue * 0.94
    for (let i = 47; i >= 0; i--) {
      v += (Math.random() - 0.46) * baseValue * 0.004
      pts.push({ time: now - i * 1800, value: Math.max(v, baseValue * 0.80) })
    }
    pts.push({ time: now, value: baseValue })
    return pts
  }, [equityHistory, portfolioStats])

  if (points.length < 2) return null

  const W = 100 // viewBox units
  const H = 44
  const pad = 2
  const values = points.map(p => p.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const toX = (i: number) => pad + (i / (points.length - 1)) * (W - pad * 2)
  const toY = (v: number) => pad + (1 - (v - min) / range) * (H - pad * 2)

  const linePoints = points.map((p, i) => `${toX(i)},${toY(p.value)}`).join(' ')
  const areaPoints = `${pad},${H} ${linePoints} ${toX(points.length - 1)},${H}`

  const isUp = values[values.length - 1] >= values[0]
  const color = isUp ? 'var(--accent-green)' : 'var(--accent-red)'
  const colorRaw = isUp ? '0,255,136' : '255,61,90'

  const first = values[0]
  const last  = values[values.length - 1]
  const pct   = ((last - first) / first) * 100
  const sign  = pct >= 0 ? '+' : ''

  return (
    <div style={{
      background: 'var(--ink-800)', border: '1px solid var(--hairline)',
      borderRadius: 9, padding: '10px 14px',
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, color: 'var(--mute)', letterSpacing: '0.08em', fontWeight: 600 }}>EQUITY CURVE</span>
        <span className="num" style={{ fontSize: 11, fontWeight: 700, color }}>
          {sign}{pct.toFixed(2)}% <span style={{ color: 'var(--mute)', fontWeight: 400 }}>24h</span>
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{ width: '100%', height: 44, display: 'block', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="eq-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={`rgb(${colorRaw})`} stopOpacity="0.25" />
            <stop offset="100%" stopColor={`rgb(${colorRaw})`} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <polygon points={areaPoints} fill="url(#eq-grad)" />
        <polyline
          points={linePoints}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {/* Current value dot */}
        <circle
          cx={toX(points.length - 1)}
          cy={toY(last)}
          r="2.5"
          fill={color}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  )
}
