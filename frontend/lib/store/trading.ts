'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Ticker, Signal, Position, Order, PortfolioStats, WatchlistItem, Timeframe, ChartType } from '@/types/trading'

export interface Toast {
  id: string
  type: 'buy' | 'sell' | 'info' | 'success' | 'error'
  title: string
  message: string
  duration?: number
}

interface TradingState {
  // Selected symbol
  activeSymbol: string
  setActiveSymbol: (symbol: string) => void

  // Chart settings
  timeframe: Timeframe
  setTimeframe: (tf: Timeframe) => void
  chartType: ChartType
  setChartType: (type: ChartType) => void

  // Live data
  tickers: Record<string, Ticker>
  updateTicker: (ticker: Ticker) => void

  // Price history for sparklines (last 20 ticks per symbol)
  priceHistory: Record<string, number[]>
  updatePriceHistory: (symbol: string, price: number) => void

  // Signals
  signals: Signal[]
  setSignals: (signals: Signal[]) => void
  addSignal: (signal: Signal) => void

  // Portfolio
  positions: Position[]
  setPositions: (positions: Position[]) => void
  portfolioStats: PortfolioStats | null
  setPortfolioStats: (stats: PortfolioStats) => void

  // Equity curve — { time: unix-seconds, value: totalValue }[]
  equityHistory: { time: number; value: number }[]
  pushEquityPoint: (value: number) => void

  // Orders
  orders: Order[]
  setOrders: (orders: Order[]) => void
  addOrder: (order: Order) => void

  // Watchlist
  watchlist: string[]
  addToWatchlist: (symbol: string) => void
  removeFromWatchlist: (symbol: string) => void

  // Connection state
  connected: boolean
  setConnected: (v: boolean) => void

  // Toasts
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void

  // UI
  sidebarCollapsed: boolean
  toggleSidebar: () => void
}

export const useTradingStore = create<TradingState>()(
  persist(
    (set) => ({
      activeSymbol: 'BTCUSDT',
      setActiveSymbol: (symbol) => set({ activeSymbol: symbol }),

      timeframe: '15m',
      setTimeframe: (timeframe) => set({ timeframe }),
      chartType: 'candlestick',
      setChartType: (chartType) => set({ chartType }),

      tickers: {},
      updateTicker: (ticker) =>
        set((state) => ({ tickers: { ...state.tickers, [ticker.symbol]: ticker } })),

      priceHistory: {},
      updatePriceHistory: (symbol, price) =>
        set((state) => {
          const prev = state.priceHistory[symbol] ?? []
          return { priceHistory: { ...state.priceHistory, [symbol]: [...prev, price].slice(-20) } }
        }),

      signals: [],
      setSignals: (signals) => set({ signals }),
      addSignal: (signal) =>
        set((state) => ({ signals: [signal, ...state.signals].slice(0, 50) })),

      positions: [],
      setPositions: (positions) => set({ positions }),
      portfolioStats: null,
      setPortfolioStats: (portfolioStats) => set({ portfolioStats }),

      equityHistory: [],
      pushEquityPoint: (value) =>
        set((state) => ({
          equityHistory: [
            ...state.equityHistory,
            { time: Math.floor(Date.now() / 1000), value },
          ].slice(-288), // keep 24h at 5-min resolution
        })),

      orders: [],
      setOrders: (orders) => set({ orders }),
      addOrder: (order) =>
        set((state) => ({ orders: [order, ...state.orders].slice(0, 200) })),

      watchlist: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT'],
      addToWatchlist: (symbol) =>
        set((state) =>
          state.watchlist.includes(symbol)
            ? state
            : { watchlist: [...state.watchlist, symbol] }
        ),
      removeFromWatchlist: (symbol) =>
        set((state) => ({ watchlist: state.watchlist.filter((s) => s !== symbol) })),

      connected: false,
      setConnected: (connected) => set({ connected }),

      toasts: [],
      addToast: (toast) =>
        set((state) => ({
          toasts: [...state.toasts, { ...toast, id: `toast-${Date.now()}-${Math.random()}` }].slice(-5),
        })),
      removeToast: (id) =>
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    }),
    {
      name: 'tradeai-store',
      partialize: (state) => ({
        activeSymbol: state.activeSymbol,
        timeframe: state.timeframe,
        chartType: state.chartType,
        watchlist: state.watchlist,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
)
