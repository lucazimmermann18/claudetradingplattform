'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  createChart,
  ColorType,
  CrosshairMode,
  LineStyle,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
} from 'lightweight-charts'
import type { IChartApi, ISeriesApi, Time } from 'lightweight-charts'
import { useTradingStore } from '@/lib/store/trading'
import { marketApi } from '@/lib/api/client'
import type { Timeframe } from '@/types/trading'
import { Activity } from 'lucide-react'

const TIMEFRAMES: Timeframe[] = ['1m', '5m', '15m', '1h', '4h', '1d']

const C = {
  bg: '#0f1623',
  grid: '#1e2d40',
  text: '#7a8da8',
  up: '#00ff88',
  down: '#ff4757',
}

interface Indicators {
  ema20: boolean
  ema50: boolean
  bollinger: boolean
  volume: boolean
}

function calcEMA(data: number[], period: number): number[] {
  const k = 2 / (period + 1)
  const ema: number[] = new Array(data.length).fill(0)
  ema[period - 1] = data.slice(0, period).reduce((a, b) => a + b, 0) / period
  for (let i = period; i < data.length; i++) {
    ema[i] = data[i] * k + ema[i - 1] * (1 - k)
  }
  return ema
}

function calcBollinger(data: number[], period = 20, mult = 2) {
  const upper: number[] = [], middle: number[] = [], lower: number[] = []
  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1)
    const mean = slice.reduce((a, b) => a + b, 0) / period
    const std = Math.sqrt(slice.reduce((a, b) => a + (b - mean) ** 2, 0) / period)
    upper[i] = mean + mult * std
    middle[i] = mean
    lower[i] = mean - mult * std
  }
  return { upper, middle, lower }
}

export default function TradingChart() {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const volumeRef = useRef<ISeriesApi<'Histogram'> | null>(null)
  const ema20Ref = useRef<ISeriesApi<'Line'> | null>(null)
  const ema50Ref = useRef<ISeriesApi<'Line'> | null>(null)
  const bbUpperRef = useRef<ISeriesApi<'Line'> | null>(null)
  const bbMidRef = useRef<ISeriesApi<'Line'> | null>(null)
  const bbLowRef = useRef<ISeriesApi<'Line'> | null>(null)

  const { activeSymbol, timeframe, setTimeframe, tickers } = useTradingStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [indicators, setIndicators] = useState<Indicators>({
    ema20: true, ema50: true, bollinger: false, volume: true,
  })

  const loadData = useCallback(async () => {
    if (!activeSymbol || !chartRef.current) return
    setLoading(true)
    setError(null)

    try {
      const res = await marketApi.getOHLCV(activeSymbol, timeframe, 500)
      const raw = res.data.data as Array<{
        time: number; open: number; high: number; low: number; close: number; volume: number
      }>

      if (!candleRef.current) return

      candleRef.current.setData(
        raw.map((d) => ({ time: d.time as Time, open: d.open, high: d.high, low: d.low, close: d.close }))
      )

      if (volumeRef.current && indicators.volume) {
        volumeRef.current.setData(
          raw.map((d) => ({
            time: d.time as Time,
            value: d.volume,
            color: d.close >= d.open ? 'rgba(0,255,136,0.3)' : 'rgba(255,71,87,0.3)',
          }))
        )
      }

      const closes = raw.map((d) => d.close)

      if (ema20Ref.current && indicators.ema20 && closes.length >= 20) {
        const ema20 = calcEMA(closes, 20)
        ema20Ref.current.setData(
          raw.slice(19).map((d, i) => ({ time: d.time as Time, value: ema20[i + 19] }))
        )
      }

      if (ema50Ref.current && indicators.ema50 && closes.length >= 50) {
        const ema50 = calcEMA(closes, 50)
        ema50Ref.current.setData(
          raw.slice(49).map((d, i) => ({ time: d.time as Time, value: ema50[i + 49] }))
        )
      }

      if (bbUpperRef.current && indicators.bollinger && closes.length >= 20) {
        const bb = calcBollinger(closes)
        const bbData = raw.slice(19).map((d, i) => ({
          time: d.time as Time,
          upper: bb.upper[i + 19],
          mid: bb.middle[i + 19],
          low: bb.lower[i + 19],
        })).filter((d) => d.upper !== undefined)

        bbUpperRef.current.setData(bbData.map((d) => ({ time: d.time, value: d.upper })))
        bbMidRef.current?.setData(bbData.map((d) => ({ time: d.time, value: d.mid })))
        bbLowRef.current?.setData(bbData.map((d) => ({ time: d.time, value: d.low })))
      }

      chartRef.current.timeScale().fitContent()
    } catch {
      setError('Failed to load chart data')
    } finally {
      setLoading(false)
    }
  }, [activeSymbol, timeframe, indicators])

  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: C.bg },
        textColor: C.text,
        fontSize: 11,
      },
      grid: {
        vertLines: { color: C.grid, style: LineStyle.Dotted },
        horzLines: { color: C.grid, style: LineStyle.Dotted },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: '#253347', width: 1, style: LineStyle.Dashed, labelBackgroundColor: '#253347' },
        horzLine: { color: '#253347', width: 1, style: LineStyle.Dashed, labelBackgroundColor: '#253347' },
      },
      rightPriceScale: { borderColor: C.grid, scaleMargins: { top: 0.1, bottom: 0.25 } },
      timeScale: { borderColor: C.grid, timeVisible: true, secondsVisible: false },
      handleScroll: true,
      handleScale: true,
    })
    chartRef.current = chart

    candleRef.current = chart.addSeries(CandlestickSeries, {
      upColor: C.up, downColor: C.down,
      borderUpColor: C.up, borderDownColor: C.down,
      wickUpColor: C.up, wickDownColor: C.down,
    })

    volumeRef.current = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    })
    chart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } })

    ema20Ref.current = chart.addSeries(LineSeries, { color: '#00d4ff', lineWidth: 1, priceLineVisible: false, lastValueVisible: false })
    ema50Ref.current = chart.addSeries(LineSeries, { color: '#ffd32a', lineWidth: 1, priceLineVisible: false, lastValueVisible: false })
    bbUpperRef.current = chart.addSeries(LineSeries, { color: 'rgba(168,85,247,0.7)', lineWidth: 1, priceLineVisible: false, lastValueVisible: false })
    bbMidRef.current = chart.addSeries(LineSeries, { color: 'rgba(168,85,247,0.4)', lineWidth: 1, lineStyle: LineStyle.Dashed, priceLineVisible: false, lastValueVisible: false })
    bbLowRef.current = chart.addSeries(LineSeries, { color: 'rgba(168,85,247,0.7)', lineWidth: 1, priceLineVisible: false, lastValueVisible: false })

    const observer = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight })
      }
    })
    observer.observe(containerRef.current)

    return () => { observer.disconnect(); chart.remove() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Live tick update
  useEffect(() => {
    const ticker = tickers[activeSymbol]
    if (!ticker || !candleRef.current) return
    const now = Math.floor(Date.now() / 1000)
    candleRef.current.update({ time: now as Time, open: ticker.price, high: ticker.price, low: ticker.price, close: ticker.price })
  }, [tickers, activeSymbol])

  useEffect(() => { loadData() }, [loadData])

  const INDICATOR_DEFS = [
    { key: 'ema20' as const, label: 'EMA 20', color: '#00d4ff' },
    { key: 'ema50' as const, label: 'EMA 50', color: '#ffd32a' },
    { key: 'bollinger' as const, label: 'BB', color: '#a855f7' },
    { key: 'volume' as const, label: 'VOL', color: '#7a8da8' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.bg }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
        borderBottom: '1px solid #1e2d40', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: 2 }}>
          {TIMEFRAMES.map((tf) => (
            <button key={tf} onClick={() => setTimeframe(tf)} style={{
              padding: '4px 10px', borderRadius: 6,
              background: timeframe === tf ? 'rgba(0,212,255,0.15)' : 'transparent',
              border: timeframe === tf ? '1px solid rgba(0,212,255,0.3)' : '1px solid transparent',
              color: timeframe === tf ? '#00d4ff' : '#7a8da8',
              fontSize: 12, fontWeight: timeframe === tf ? 600 : 400, cursor: 'pointer',
            }}>{tf}</button>
          ))}
        </div>

        <div style={{ width: 1, height: 20, background: '#1e2d40', margin: '0 4px' }} />

        {INDICATOR_DEFS.map(({ key, label, color }) => (
          <button key={key} onClick={() => setIndicators((p) => ({ ...p, [key]: !p[key] }))} style={{
            padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4,
            background: indicators[key] ? `${color}1a` : 'transparent',
            border: indicators[key] ? `1px solid ${color}44` : '1px solid transparent',
            color: indicators[key] ? color : '#4a5568',
          }}>
            <div style={{ width: 8, height: 2, background: color, borderRadius: 1 }} />
            {label}
          </button>
        ))}

        <div style={{ marginLeft: 'auto' }}>
          {loading && <span style={{ fontSize: 11, color: '#4a5568' }}>Loading...</span>}
        </div>
      </div>

      {/* Chart */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
        {error && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(7,10,18,0.85)',
          }}>
            <div style={{ textAlign: 'center', color: '#ff4757' }}>
              <Activity size={32} style={{ margin: '0 auto 8px' }} />
              <div style={{ fontSize: 14, marginBottom: 12 }}>{error}</div>
              <button onClick={loadData} style={{
                padding: '6px 16px', borderRadius: 6, background: '#00d4ff',
                color: '#000', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>Retry</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
