'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useTradingStore } from '@/lib/store/trading'
import { generateOHLCV } from '@/lib/mock'
import { formatPrice } from '@/lib/utils/format'
import { TrendingUp, TrendingDown, X } from 'lucide-react'

const SYMBOLS = ['BTCUSDT','ETHUSDT','SOLUSDT','BNBUSDT','XRPUSDT','ADAUSDT','DOTUSDT','AVAXUSDT','LINKUSDT','LTCUSDT']

interface MiniChartProps {
  symbol: string
  index: number
  onChangeSymbol: (symbol: string) => void
}

export default function MiniChart({ symbol, index, onChangeSymbol }: MiniChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<ReturnType<typeof import('lightweight-charts')['createChart']> | null>(null)
  const candleRef = useRef<unknown>(null)
  const [picking, setPicking] = useState(false)

  const ticker = useTradingStore(s => s.tickers[symbol])

  const initChart = useCallback(async () => {
    if (!containerRef.current) return
    const { createChart, CandlestickSeries } = await import('lightweight-charts')

    if (chartRef.current) {
      chartRef.current.remove()
      chartRef.current = null
    }

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: '#5a6779',
        fontSize: 10,
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.03)' },
        horzLines: { color: 'rgba(255,255,255,0.03)' },
      },
      crosshair: { mode: 1 },
      rightPriceScale: {
        borderColor: 'rgba(255,255,255,0.06)',
        textColor: '#5a6779',
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: 'rgba(255,255,255,0.06)',
        timeVisible: true,
        secondsVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      handleScroll: true,
      handleScale: true,
    })

    const candles = chart.addSeries(CandlestickSeries, {
      upColor: '#00ff88',
      downColor: '#ff3d5a',
      borderUpColor: '#00ff88',
      borderDownColor: '#ff3d5a',
      wickUpColor: '#00ff88',
      wickDownColor: '#ff3d5a',
    })

    const data = generateOHLCV(symbol, '15m', 80)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    candles.setData(data as unknown as any)
    chart.timeScale().fitContent()

    chartRef.current = chart
    candleRef.current = candles

    const ro = new ResizeObserver(() => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        })
      }
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [symbol])

  useEffect(() => {
    const cleanup = initChart()
    return () => { cleanup?.then(fn => fn?.()) }
  }, [initChart])

  // Live tick update
  useEffect(() => {
    if (!ticker || !candleRef.current) return
    const candles = candleRef.current as { update: (bar: object) => void }
    const now = Math.floor(Date.now() / 1000)
    candles.update({
      time: now - (now % 900),
      open: ticker.price * 0.9998,
      high: ticker.high24h,
      low: ticker.low24h,
      close: ticker.price,
    })
  }, [ticker])

  const base = symbol.replace('USDT', '')
  const changePos = (ticker?.changePercent ?? 0) >= 0
  const changeColor = changePos ? 'var(--accent-green)' : 'var(--accent-red)'

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      background: 'var(--ink-850)', border: '1px solid var(--hairline)',
      borderRadius: 10, overflow: 'hidden', position: 'relative',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px', borderBottom: '1px solid var(--hairline)',
        background: 'rgba(255,255,255,0.01)', flexShrink: 0,
      }}>
        <button onClick={() => setPicking(v => !v)} style={{
          display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer',
          background: 'none', border: 'none', padding: 0,
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>
            {base}<span style={{ color: 'var(--mute)', fontSize: 11, fontWeight: 400 }}>/USDT</span>
          </span>
          {changePos ? <TrendingUp size={11} color={changeColor} /> : <TrendingDown size={11} color={changeColor} />}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {ticker && (
            <>
              <span className="num" style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>
                ${formatPrice(ticker.price)}
              </span>
              <span className="num" style={{ fontSize: 10, color: changeColor }}>
                {changePos ? '+' : ''}{ticker.changePercent.toFixed(2)}%
              </span>
            </>
          )}
        </div>
      </div>

      {/* Chart area */}
      <div ref={containerRef} style={{ flex: 1, position: 'relative', minHeight: 0 }} />

      {/* Symbol picker dropdown */}
      {picking && (
        <div style={{
          position: 'absolute', top: 40, left: 8, zIndex: 50,
          background: 'var(--ink-800)', border: '1px solid var(--hairline2)',
          borderRadius: 8, padding: 6, boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, width: 200,
        }}>
          <div style={{
            gridColumn: '1/-1', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '4px 6px', marginBottom: 2,
          }}>
            <span style={{ fontSize: 10, color: 'var(--mute)', letterSpacing: '0.08em', fontWeight: 600 }}>SELECT SYMBOL</span>
            <button onClick={() => setPicking(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--mute)' }}>
              <X size={12} />
            </button>
          </div>
          {SYMBOLS.map(sym => (
            <button key={sym} onClick={() => { onChangeSymbol(sym); setPicking(false) }} style={{
              padding: '6px 8px', borderRadius: 5, cursor: 'pointer', border: 'none', textAlign: 'left',
              background: sym === symbol ? 'rgba(0,212,255,0.08)' : 'rgba(255,255,255,0.02)',
              color: sym === symbol ? 'var(--accent-blue)' : '#d7dde7',
              fontSize: 11, fontWeight: sym === symbol ? 700 : 400,
            }}>
              {sym.replace('USDT', '')}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
