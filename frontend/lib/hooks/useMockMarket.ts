'use client'

import { useEffect, useRef } from 'react'
import { useTradingStore } from '@/lib/store/trading'
import { tickPrice, generateSignals, generatePortfolio, BASE } from '@/lib/mock'

const ALL_SYMBOLS = Object.keys(BASE)

export function useMockMarket() {
  const {
    updateTicker, updatePriceHistory,
    addSignal, setSignals,
    setConnected, setPositions, setPortfolioStats, setOrders,
    addToast,
  } = useTradingStore()
  const initialized = useRef(false)

  useEffect(() => {
    setConnected(true)

    // Initialize all tickers
    ALL_SYMBOLS.forEach(sym => {
      const t = tickPrice(sym)
      updateTicker(t)
      updatePriceHistory(sym, t.price)
    })

    // Seed initial signals
    const sigs = generateSignals(ALL_SYMBOLS)
    setSignals(sigs)

    // Seed portfolio
    const { stats, positions } = generatePortfolio()
    setPortfolioStats(stats)
    setPositions(positions)
    setOrders([])

    initialized.current = true

    // Live ticker updates every 1s
    const tickerInterval = setInterval(() => {
      ALL_SYMBOLS.forEach(sym => {
        const t = tickPrice(sym)
        updateTicker(t)
        updatePriceHistory(sym, t.price)
      })
    }, 1000)

    // New signals every 90s → also fire a toast
    const signalInterval = setInterval(() => {
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
    }, 90_000)

    // Portfolio P&L refresh every 5s
    const portfolioInterval = setInterval(() => {
      const { stats: s, positions: p } = generatePortfolio()
      setPortfolioStats(s)
      setPositions(p)
    }, 5_000)

    return () => {
      clearInterval(tickerInterval)
      clearInterval(signalInterval)
      clearInterval(portfolioInterval)
      setConnected(false)
    }
  }, [updateTicker, updatePriceHistory, addSignal, setSignals, setConnected, setPositions, setPortfolioStats, setOrders, addToast])
}
