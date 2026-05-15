'use client'

import { useEffect, useRef } from 'react'
import { useTradingStore } from '@/lib/store/trading'
import { tickPrice, generateSignals, generatePortfolio, BASE } from '@/lib/mock'

const ALL_SYMBOLS = Object.keys(BASE)
const WS_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
  .replace(/^http/, 'ws') + '/ws'

export function useMockMarket() {
  const {
    updateTicker, updatePriceHistory,
    addSignal, setSignals,
    setConnected, setPositions, setPortfolioStats, setOrders,
    addToast, pushEquityPoint, setScannerCountdown,
  } = useTradingStore()

  const wsRef  = useRef<WebSocket | null>(null)
  const liveRef = useRef(false) // true when real WS is delivering tickers

  useEffect(() => {
    // ── Seed mock state immediately so UI is never blank ──────────────────
    ALL_SYMBOLS.forEach(sym => {
      const t = tickPrice(sym)
      updateTicker(t)
      updatePriceHistory(sym, t.price)
    })
    setSignals(generateSignals(ALL_SYMBOLS))
    const { stats, positions } = generatePortfolio()
    setPortfolioStats(stats)
    setPositions(positions)
    setOrders([])

    // ── Try real backend WebSocket ────────────────────────────────────────
    let reconnectDelay = 2000
    let wsActive = true
    let pingTimer: ReturnType<typeof setInterval> | null = null

    function connect() {
      if (!wsActive) return
      try {
        const ws = new WebSocket(WS_URL)
        wsRef.current = ws

        ws.onopen = () => {
          reconnectDelay = 2000
          ws.send(JSON.stringify({ type: 'subscribe', symbols: ALL_SYMBOLS }))
          pingTimer = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'ping' }))
          }, 20_000)
        }

        ws.onmessage = (ev) => {
          try {
            const msg = JSON.parse(ev.data)
            if (msg.type === 'ticker' && msg.data) {
              liveRef.current = true
              setConnected(true)
              updateTicker(msg.data)
              updatePriceHistory(msg.data.symbol, msg.data.price)
            } else if (msg.type === 'signal' && msg.data) {
              addSignal(msg.data)
            }
          } catch { /* ignore malformed frames */ }
        }

        ws.onerror = () => { /* handled by onclose */ }

        ws.onclose = () => {
          if (pingTimer) { clearInterval(pingTimer); pingTimer = null }
          liveRef.current = false
          if (!wsActive) return
          // exponential back-off, max 30 s
          setTimeout(connect, reconnectDelay)
          reconnectDelay = Math.min(reconnectDelay * 2, 30_000)
        }
      } catch { /* WebSocket not available in SSR — ignore */ }
    }

    connect()

    // ── Mock ticker fallback (only fires when WS is not live) ─────────────
    const tickerInterval = setInterval(() => {
      if (liveRef.current) return // real data flowing; skip mock ticks
      ALL_SYMBOLS.forEach(sym => {
        const t = tickPrice(sym)
        updateTicker(t)
        updatePriceHistory(sym, t.price)
      })
    }, 1000)

    // ── Connection status sentinel ─────────────────────────────────────────
    // Mark connected=true once WS is live; revert to mock-connected otherwise
    const connInterval = setInterval(() => {
      if (!liveRef.current) setConnected(true) // mock is "connected" too
    }, 2000)

    setConnected(true) // optimistic — mock is always available

    // ── Scanner countdown ─────────────────────────────────────────────────
    setScannerCountdown(60)
    const countdownInterval = setInterval(() => {
      const cur = useTradingStore.getState().scannerCountdown
      setScannerCountdown(cur <= 1 ? 60 : cur - 1)
    }, 1000)

    // ── Signal generation (mock, every 60 s) ──────────────────────────────
    const signalInterval = setInterval(() => {
      setScannerCountdown(60)
      const newSigs = generateSignals(ALL_SYMBOLS.slice(0, 3))
      const sig = newSigs[0]
      if (sig) {
        addSignal(sig)
        addToast({
          type: sig.type === 'BUY' ? 'buy' : sig.type === 'SELL' ? 'sell' : 'info',
          title: `${sig.type} Signal — ${sig.symbol.replace('USDT', '/USDT')}`,
          message: `${sig.confidence}% confidence · ${sig.timeframe}`,
          duration: 6000,
        })
      }
    }, 60_000)

    // ── Portfolio / equity (mock, every 5 s) ──────────────────────────────
    let equityTick = 0
    const portfolioInterval = setInterval(() => {
      const { stats: s, positions: p } = generatePortfolio()
      setPortfolioStats(s)
      setPositions(p)
      equityTick++
      if (equityTick % 60 === 0) pushEquityPoint(s.totalValue)
    }, 5_000)

    return () => {
      wsActive = false
      if (pingTimer) clearInterval(pingTimer)
      wsRef.current?.close()
      clearInterval(tickerInterval)
      clearInterval(connInterval)
      clearInterval(countdownInterval)
      clearInterval(signalInterval)
      clearInterval(portfolioInterval)
      setConnected(false)
    }
  }, [
    updateTicker, updatePriceHistory, addSignal, setSignals,
    setConnected, setPositions, setPortfolioStats, setOrders,
    addToast, pushEquityPoint, setScannerCountdown,
  ])
}
