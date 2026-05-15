export interface Ticker {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
  high24h: number
  low24h: number
  marketCap?: number
  bid?: number
  ask?: number
}

export interface OHLCV {
  time: number // Unix timestamp (seconds)
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface Signal {
  id: string
  symbol: string
  type: 'BUY' | 'SELL' | 'NEUTRAL'
  confidence: number // 0-100
  price: number
  targetPrice?: number
  stopLoss?: number
  reasoning: string
  indicators: {
    rsi?: number
    macd?: number
    macdSignal?: number
    bollinger?: { upper: number; middle: number; lower: number }
    ema20?: number
    ema50?: number
    volume?: number
  }
  timestamp: string
  timeframe: string
}

export interface Position {
  id: string
  symbol: string
  name: string
  quantity: number
  avgPrice: number
  currentPrice: number
  pnl: number
  pnlPercent: number
  value: number
  side: 'LONG' | 'SHORT'
}

export interface Order {
  id: string
  symbol: string
  side: 'BUY' | 'SELL'
  type: 'MARKET' | 'LIMIT' | 'STOP'
  quantity: number
  price?: number
  stopPrice?: number
  status: 'PENDING' | 'FILLED' | 'CANCELLED' | 'PARTIAL'
  filledQty: number
  filledPrice?: number
  createdAt: string
  updatedAt: string
}

export interface OrderBookEntry {
  price: number
  quantity: number
  total: number
}

export interface OrderBook {
  symbol: string
  bids: OrderBookEntry[]
  asks: OrderBookEntry[]
  spread: number
  spreadPercent: number
  timestamp: string
}

export interface PortfolioStats {
  totalValue: number
  totalPnl: number
  totalPnlPercent: number
  dayPnl: number
  dayPnlPercent: number
  cash: number
  invested: number
  winRate: number
  totalTrades: number
}

export interface Trade {
  id: string
  symbol: string
  side: 'BUY' | 'SELL'
  quantity: number
  price: number
  fee: number
  total: number
  pnl?: number
  timestamp: string
}

export type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w'

export type ChartType = 'candlestick' | 'line' | 'area'

export interface Indicator {
  id: string
  name: string
  enabled: boolean
  params?: Record<string, number>
}

export interface WatchlistItem {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  signal?: 'BUY' | 'SELL' | 'NEUTRAL'
  volume: number
}
