'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Ticker, Signal, Position, Order, PortfolioStats, WatchlistItem, Timeframe, ChartType } from '@/types/trading'

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

  // Signals
  signals: Signal[]
  setSignals: (signals: Signal[]) => void
  addSignal: (signal: Signal) => void

  // Portfolio
  positions: Position[]
  setPositions: (positions: Position[]) => void
  portfolioStats: PortfolioStats | null
  setPortfolioStats: (stats: PortfolioStats) => void

  // Orders
  orders: Order[]
  setOrders: (orders: Order[]) => void

  // Watchlist
  watchlist: string[]
  addToWatchlist: (symbol: string) => void
  removeFromWatchlist: (symbol: string) => void

  // Connection state
  connected: boolean
  setConnected: (v: boolean) => void

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

      signals: [],
      setSignals: (signals) => set({ signals }),
      addSignal: (signal) =>
        set((state) => ({ signals: [signal, ...state.signals].slice(0, 50) })),

      positions: [],
      setPositions: (positions) => set({ positions }),
      portfolioStats: null,
      setPortfolioStats: (portfolioStats) => set({ portfolioStats }),

      orders: [],
      setOrders: (orders) => set({ orders }),

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
