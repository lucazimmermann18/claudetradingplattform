'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  createChart, ColorType, CrosshairMode, LineStyle,
  CandlestickSeries, LineSeries, HistogramSeries,
} from 'lightweight-charts'
import type { IChartApi, ISeriesApi, Time } from 'lightweight-charts'
import { useTradingStore } from '@/lib/store/trading'
import { marketApi } from '@/lib/api/client'
import type { Timeframe } from '@/types/trading'
import { Activity } from 'lucide-react'

const TFS: Timeframe[] = ['1m','5m','15m','1h','4h','1d']

const INDICATORS = [
  { key: 'ema20',     label: 'EMA 20', color: '#00d4ff' },
  { key: 'ema50',     label: 'EMA 50', color: '#ffb800' },
  { key: 'bollinger', label: 'BB',     color: '#a78bfa' },
  { key: 'volume',    label: 'VOL',    color: '#5a6779' },
] as const

type IndicatorKey = typeof INDICATORS[number]['key']
type IndState = Record<IndicatorKey, boolean>

function calcEMA(d: number[], p: number): number[] {
  const k = 2 / (p + 1), ema = new Array(d.length).fill(0)
  ema[p - 1] = d.slice(0, p).reduce((a, b) => a + b, 0) / p
  for (let i = p; i < d.length; i++) ema[i] = d[i] * k + ema[i - 1] * (1 - k)
  return ema
}

function calcBB(d: number[], p = 20, m = 2) {
  const upper: number[] = [], mid: number[] = [], lower: number[] = []
  for (let i = p - 1; i < d.length; i++) {
    const s = d.slice(i - p + 1, i + 1)
    const mean = s.reduce((a, b) => a + b) / p
    const std = Math.sqrt(s.reduce((a, b) => a + (b - mean) ** 2, 0) / p)
    upper[i] = mean + m * std; mid[i] = mean; lower[i] = mean - m * std
  }
  return { upper, mid, lower }
}

export default function TradingChart() {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef     = useRef<IChartApi | null>(null)
  const candleRef    = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const volRef       = useRef<ISeriesApi<'Histogram'> | null>(null)
  const ema20Ref     = useRef<ISeriesApi<'Line'> | null>(null)
  const ema50Ref     = useRef<ISeriesApi<'Line'> | null>(null)
  const bbURef       = useRef<ISeriesApi<'Line'> | null>(null)
  const bbMRef       = useRef<ISeriesApi<'Line'> | null>(null)
  const bbLRef       = useRef<ISeriesApi<'Line'> | null>(null)

  const { activeSymbol, timeframe, setTimeframe, tickers } = useTradingStore()
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [ind, setInd] = useState<IndState>({ ema20: true, ema50: true, bollinger: false, volume: true })

  const loadData = useCallback(async () => {
    if (!activeSymbol || !chartRef.current) return
    setLoading(true); setError(null)
    try {
      const res = await marketApi.getOHLCV(activeSymbol, timeframe, 500)
      const raw = res.data.data as Array<{ time: number; open: number; high: number; low: number; close: number; volume: number }>
      if (!candleRef.current) return

      candleRef.current.setData(raw.map(d => ({ time: d.time as Time, open: d.open, high: d.high, low: d.low, close: d.close })))

      if (volRef.current && ind.volume)
        volRef.current.setData(raw.map(d => ({ time: d.time as Time, value: d.volume, color: d.close >= d.open ? 'rgba(0,255,136,0.25)' : 'rgba(255,61,90,0.25)' })))

      const closes = raw.map(d => d.close)

      if (ema20Ref.current && ind.ema20 && closes.length >= 20) {
        const e = calcEMA(closes, 20)
        ema20Ref.current.setData(raw.slice(19).map((d, i) => ({ time: d.time as Time, value: e[i + 19] })))
      }
      if (ema50Ref.current && ind.ema50 && closes.length >= 50) {
        const e = calcEMA(closes, 50)
        ema50Ref.current.setData(raw.slice(49).map((d, i) => ({ time: d.time as Time, value: e[i + 49] })))
      }
      if (bbURef.current && ind.bollinger && closes.length >= 20) {
        const bb = calcBB(closes)
        const bd = raw.slice(19).map((d, i) => ({ time: d.time as Time, u: bb.upper[i+19], m: bb.mid[i+19], l: bb.lower[i+19] })).filter(d => d.u !== undefined)
        bbURef.current.setData(bd.map(d => ({ time: d.time, value: d.u })))
        bbMRef.current?.setData(bd.map(d => ({ time: d.time, value: d.m })))
        bbLRef.current?.setData(bd.map(d => ({ time: d.time, value: d.l })))
      }

      chartRef.current.timeScale().fitContent()
    } catch { setError('Failed to load chart data') }
    finally { setLoading(false) }
  }, [activeSymbol, timeframe, ind])

  useEffect(() => {
    if (!containerRef.current) return
    const chart = createChart(containerRef.current, {
      layout: { background: { type: ColorType.Solid, color: '#070a12' }, textColor: '#5a6779', fontSize: 11 },
      grid: { vertLines: { color: 'rgba(255,255,255,0.03)', style: LineStyle.Dotted }, horzLines: { color: 'rgba(255,255,255,0.03)', style: LineStyle.Dotted } },
      crosshair: { mode: CrosshairMode.Normal, vertLine: { color: 'rgba(255,255,255,0.15)', width: 1, style: LineStyle.Dashed, labelBackgroundColor: '#1d2531' }, horzLine: { color: 'rgba(255,255,255,0.15)', width: 1, style: LineStyle.Dashed, labelBackgroundColor: '#1d2531' } },
      rightPriceScale: { borderColor: 'rgba(255,255,255,0.06)', scaleMargins: { top: 0.08, bottom: 0.22 } },
      timeScale: { borderColor: 'rgba(255,255,255,0.06)', timeVisible: true, secondsVisible: false },
      handleScroll: true, handleScale: true,
    })
    chartRef.current = chart

    candleRef.current = chart.addSeries(CandlestickSeries, { upColor: '#00ff88', downColor: '#ff3d5a', borderUpColor: '#00ff88', borderDownColor: '#ff3d5a', wickUpColor: '#00ff88', wickDownColor: '#ff3d5a' })
    volRef.current    = chart.addSeries(HistogramSeries, { priceFormat: { type: 'volume' }, priceScaleId: 'vol' })
    chart.priceScale('vol').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } })
    ema20Ref.current  = chart.addSeries(LineSeries, { color: '#00d4ff', lineWidth: 1, priceLineVisible: false, lastValueVisible: false })
    ema50Ref.current  = chart.addSeries(LineSeries, { color: '#ffb800', lineWidth: 1, priceLineVisible: false, lastValueVisible: false })
    bbURef.current    = chart.addSeries(LineSeries, { color: 'rgba(167,139,250,0.7)', lineWidth: 1, priceLineVisible: false, lastValueVisible: false })
    bbMRef.current    = chart.addSeries(LineSeries, { color: 'rgba(167,139,250,0.4)', lineWidth: 1, lineStyle: LineStyle.Dashed, priceLineVisible: false, lastValueVisible: false })
    bbLRef.current    = chart.addSeries(LineSeries, { color: 'rgba(167,139,250,0.7)', lineWidth: 1, priceLineVisible: false, lastValueVisible: false })

    const ro = new ResizeObserver(() => {
      if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight })
    })
    ro.observe(containerRef.current)
    return () => { ro.disconnect(); chart.remove() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const t = tickers[activeSymbol]
    if (!t || !candleRef.current) return
    const now = Math.floor(Date.now() / 1000) as Time
    candleRef.current.update({ time: now, open: t.price, high: t.price, low: t.price, close: t.price })
  }, [tickers, activeSymbol])

  useEffect(() => { loadData() }, [loadData])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--ink-950)' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px',
        height: 40, borderBottom: '1px solid var(--hairline)', flexShrink: 0,
      }}>
        {/* Timeframes */}
        <div style={{ display: 'flex', gap: 2 }}>
          {TFS.map(tf => (
            <button key={tf} onClick={() => setTimeframe(tf)} style={{
              padding: '3px 9px', borderRadius: 5, fontSize: 11, fontWeight: timeframe === tf ? 600 : 400, cursor: 'pointer',
              background: timeframe === tf ? 'rgba(0,212,255,0.1)' : 'transparent',
              border: timeframe === tf ? '1px solid rgba(0,212,255,0.25)' : '1px solid transparent',
              color: timeframe === tf ? 'var(--accent-blue)' : 'var(--mute)',
            }}>{tf}</button>
          ))}
        </div>

        <div style={{ width: 1, height: 16, background: 'var(--hairline)', margin: '0 2px' }} />

        {/* Indicators */}
        {INDICATORS.map(({ key, label, color }) => (
          <button key={key} onClick={() => setInd(p => ({ ...p, [key]: !p[key] }))} style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '3px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: 'pointer',
            background: ind[key] ? `${color}15` : 'transparent',
            border: ind[key] ? `1px solid ${color}33` : '1px solid transparent',
            color: ind[key] ? color : 'var(--mute)',
          }}>
            <div style={{ width: 10, height: 2, background: color, borderRadius: 1, opacity: ind[key] ? 1 : 0.3 }} />
            {label}
          </button>
        ))}

        {loading && <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--mute)' }}>Loading…</span>}
      </div>

      {/* Chart */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
        {error && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(7,10,18,0.85)',
          }}>
            <div style={{ textAlign: 'center', color: 'var(--accent-red)' }}>
              <Activity size={28} style={{ margin: '0 auto 8px' }} />
              <div style={{ fontSize: 13, marginBottom: 12 }}>{error}</div>
              <button onClick={loadData} style={{
                padding: '6px 16px', borderRadius: 6, background: 'var(--accent-blue)',
                color: '#000', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>Retry</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
