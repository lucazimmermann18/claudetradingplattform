import type { Ticker, OHLCV, OrderBookEntry, Signal, Position, PortfolioStats, Trade } from '@/types/trading'

// ── Realistic base prices ──────────────────────────────────────────────────
export const BASE: Record<string, number> = {
  BTCUSDT:   95_420,
  ETHUSDT:    3_521,
  SOLUSDT:      183.5,
  BNBUSDT:      608,
  XRPUSDT:       2.47,
  ADAUSDT:       0.748,
  DOTUSDT:       7.82,
  AVAXUSDT:     36.4,
  MATICUSDT:     0.52,
  LINKUSDT:     18.3,
  LTCUSDT:      91.2,
  DOGEUSDT:      0.182,
  ATOMUSDT:      8.14,
  UNIUSDT:       7.95,
  APTUSDT:      11.2,
}

export const NAMES: Record<string, string> = {
  BTCUSDT: 'Bitcoin',  ETHUSDT: 'Ethereum', SOLUSDT: 'Solana',
  BNBUSDT: 'BNB',     XRPUSDT: 'XRP',       ADAUSDT: 'Cardano',
  DOTUSDT: 'Polkadot', AVAXUSDT: 'Avalanche', MATICUSDT: 'Polygon',
  LINKUSDT: 'Chainlink', LTCUSDT: 'Litecoin', DOGEUSDT: 'Dogecoin',
  ATOMUSDT: 'Cosmos', UNIUSDT: 'Uniswap',   APTUSDT: 'Aptos',
}

// Volatility per symbol (% std-dev per tick)
const VOL: Record<string, number> = {
  BTCUSDT: 0.0008, ETHUSDT: 0.001,  SOLUSDT: 0.0015,
  BNBUSDT: 0.001,  XRPUSDT: 0.0018, ADAUSDT: 0.002,
  DOTUSDT: 0.002,  AVAXUSDT: 0.002, MATICUSDT: 0.0025,
  LINKUSDT: 0.002, LTCUSDT: 0.0015, DOGEUSDT: 0.003,
  ATOMUSDT: 0.002, UNIUSDT: 0.002,  APTUSDT: 0.0025,
}

// ── Price state (mutable, shared across calls) ─────────────────────────────
export const state: Record<string, {
  price: number; open: number; high: number; low: number
  change: number; volume: number; tick: number
}> = {}

for (const [sym, base] of Object.entries(BASE)) {
  const drift = (Math.random() - 0.48) * base * 0.04   // ±4% random start drift
  const price = base + drift
  state[sym] = {
    price, open: price * (1 + (Math.random() - 0.5) * 0.02),
    high: price * (1 + Math.random() * 0.015),
    low:  price * (1 - Math.random() * 0.015),
    change: drift,
    volume: base * (50 + Math.random() * 150),
    tick: 0,
  }
}

// ── Random walk step ───────────────────────────────────────────────────────
export function tickPrice(sym: string): Ticker {
  const s = state[sym]
  const vol = VOL[sym] ?? 0.001
  // Geometric brownian motion with slight mean-reversion
  const drift = (BASE[sym] - s.price) * 0.00005
  const shock = (Math.random() - 0.5) * 2 * vol * s.price
  s.price = Math.max(s.price + drift + shock, s.price * 0.9)
  s.high  = Math.max(s.high, s.price)
  s.low   = Math.min(s.low, s.price)
  s.change = s.price - s.open
  s.volume += s.price * (Math.random() * 50)
  s.tick++

  return {
    symbol: sym,
    name: NAMES[sym] ?? sym,
    price: s.price,
    change: s.change,
    changePercent: (s.change / s.open) * 100,
    volume: s.volume,
    high24h: s.high,
    low24h: s.low,
    bid: s.price * (1 - 0.00005),
    ask: s.price * (1 + 0.00005),
  }
}

// ── Generate OHLCV history ─────────────────────────────────────────────────
export function generateOHLCV(sym: string, tf: string, limit = 500): OHLCV[] {
  const base = BASE[sym] ?? 1000
  const vol  = VOL[sym]  ?? 0.001
  const tfSecs: Record<string, number> = {
    '1m': 60, '5m': 300, '15m': 900, '1h': 3600, '4h': 14400, '1d': 86400, '1w': 604800,
  }
  const step = tfSecs[tf] ?? 900
  const now = Math.floor(Date.now() / 1000)
  const start = now - step * limit

  const out: OHLCV[] = []
  let price = base * (1 + (Math.random() - 0.5) * 0.1)

  for (let i = 0; i < limit; i++) {
    const t = start + i * step
    const open = price
    const moves = 8
    let hi = open, lo = open
    for (let m = 0; m < moves; m++) {
      price += (Math.random() - 0.5) * 2 * vol * price
      price += (base - price) * 0.001
      hi = Math.max(hi, price)
      lo = Math.min(lo, price)
    }
    const close = price
    out.push({ time: t, open, high: hi, low: lo, close, volume: base * (10 + Math.random() * 40) })
  }
  return out
}

// ── Order book ────────────────────────────────────────────────────────────
export function generateOrderBook(sym: string, depth = 12) {
  const price = state[sym]?.price ?? BASE[sym] ?? 1000
  const tick  = price < 1 ? 0.00001 : price < 10 ? 0.001 : price < 100 ? 0.01 : price < 1000 ? 0.1 : 1

  const side = (dir: 1 | -1): OrderBookEntry[] => {
    const rows: OrderBookEntry[] = []
    let total = 0
    for (let i = 0; i < depth; i++) {
      const p = price + dir * tick * (i + 1) * (1 + Math.random() * 0.5)
      const q = (Math.random() * 2 + 0.1) * (1 / (i + 1) * 3 + 0.5)
      total += q
      rows.push({ price: parseFloat(p.toFixed(6)), quantity: parseFloat(q.toFixed(4)), total: parseFloat(total.toFixed(4)) })
    }
    return rows
  }

  const bids = side(-1)
  const asks = side(1)
  const spread = asks[0].price - bids[0].price

  return { symbol: sym, bids, asks, spread: parseFloat(spread.toFixed(6)), spreadPercent: (spread / price) * 100, timestamp: new Date().toISOString() }
}

// ── Signals ───────────────────────────────────────────────────────────────
const REASONS = {
  BUY: [
    'RSI oversold (28.4) | MACD bullish crossover | Price above EMA200 — strong accumulation zone',
    'Bollinger Band squeeze breakout | Volume surge 2.3× average | EMA20 > EMA50 uptrend confirmed',
    'Double bottom pattern | RSI divergence detected | Institutional buy pressure increasing',
    'Support level held at EMA50 | MACD histogram turning positive | Volume profile bullish',
  ],
  SELL: [
    'RSI overbought (74.2) | MACD bearish crossover | Price rejected at upper Bollinger Band',
    'Distribution pattern at resistance | Volume declining | EMA20 crossing below EMA50',
    'Head-and-shoulders formation | RSI divergence | Momentum weakening significantly',
    'Price rejected at key resistance | Bearish engulfing candle | Volume confirmation bearish',
  ],
}

export function generateSignals(symbols: string[]): Signal[] {
  const out: Signal[] = []
  const types = ['BUY', 'SELL', 'BUY', 'BUY', 'SELL', 'NEUTRAL'] as const

  symbols.slice(0, 6).forEach((sym, i) => {
    const price = state[sym]?.price ?? BASE[sym] ?? 1
    const type  = types[i % types.length]
    const conf  = 55 + Math.floor(Math.random() * 40)
    const rsi   = type === 'BUY' ? 25 + Math.random() * 15 : type === 'SELL' ? 65 + Math.random() * 15 : 45 + Math.random() * 10
    const macd  = type === 'BUY' ? Math.random() * 50 : -Math.random() * 50

    out.push({
      id: `mock-${sym}-${Date.now() + i}`,
      symbol: sym,
      type,
      confidence: conf,
      price,
      targetPrice: type === 'BUY' ? price * (1 + 0.02 + Math.random() * 0.04) : type === 'SELL' ? price * (1 - 0.02 - Math.random() * 0.04) : undefined,
      stopLoss:    type === 'BUY' ? price * (1 - 0.01 - Math.random() * 0.01) : type === 'SELL' ? price * (1 + 0.01 + Math.random() * 0.01) : undefined,
      reasoning: REASONS[type === 'NEUTRAL' ? 'BUY' : type][Math.floor(Math.random() * 4)],
      indicators: {
        rsi: parseFloat(rsi.toFixed(1)),
        macd: parseFloat(macd.toFixed(2)),
        macdSignal: parseFloat((macd * 0.8).toFixed(2)),
        ema20: price * 0.995,
        ema50: price * 0.988,
        volume: state[sym]?.volume ?? 1_000_000,
      },
      timeframe: ['15m', '1h', '4h'][i % 3],
      timestamp: new Date(Date.now() - i * 180_000).toISOString(),
    })
  })

  return out
}

// ── Portfolio ─────────────────────────────────────────────────────────────
export function generatePortfolio(): { stats: PortfolioStats; positions: Position[]; trades: Trade[] } {
  const btcPrice = state.BTCUSDT?.price ?? 95420
  const ethPrice = state.ETHUSDT?.price ?? 3521
  const solPrice = state.SOLUSDT?.price ?? 183.5

  const positions: Position[] = [
    {
      id: 'pos-1', symbol: 'BTCUSDT', name: 'Bitcoin',
      quantity: 0.521, avgPrice: 89_200, currentPrice: btcPrice,
      pnl: (btcPrice - 89_200) * 0.521,
      pnlPercent: ((btcPrice - 89_200) / 89_200) * 100,
      value: btcPrice * 0.521, side: 'LONG',
    },
    {
      id: 'pos-2', symbol: 'ETHUSDT', name: 'Ethereum',
      quantity: 4.25, avgPrice: 3_140, currentPrice: ethPrice,
      pnl: (ethPrice - 3_140) * 4.25,
      pnlPercent: ((ethPrice - 3_140) / 3_140) * 100,
      value: ethPrice * 4.25, side: 'LONG',
    },
    {
      id: 'pos-3', symbol: 'SOLUSDT', name: 'Solana',
      quantity: 42, avgPrice: 165, currentPrice: solPrice,
      pnl: (solPrice - 165) * 42,
      pnlPercent: ((solPrice - 165) / 165) * 100,
      value: solPrice * 42, side: 'LONG',
    },
  ]

  const invested = positions.reduce((s, p) => s + p.value, 0)
  const totalPnl = positions.reduce((s, p) => s + p.pnl, 0)
  const cash = 24_850
  const totalValue = invested + cash

  const stats: PortfolioStats = {
    totalValue, cash, invested,
    totalPnl, totalPnlPercent: (totalPnl / (totalValue - totalPnl)) * 100,
    dayPnl: totalPnl * 0.12,
    dayPnlPercent: (totalPnl * 0.12) / (totalValue - totalPnl * 0.12) * 100,
    winRate: 64.3,
    totalTrades: 83,
  }

  const trades: Trade[] = [
    { id: 't-1', symbol: 'BTCUSDT', side: 'BUY',  quantity: 0.521, price: 89_200, fee: 46.51, total: 46_483.2, pnl: undefined, timestamp: new Date(Date.now() - 7 * 86400_000).toISOString() },
    { id: 't-2', symbol: 'ETHUSDT', side: 'BUY',  quantity: 4.25,  price: 3_140,  fee: 13.35, total: 13_345,   pnl: undefined, timestamp: new Date(Date.now() - 5 * 86400_000).toISOString() },
    { id: 't-3', symbol: 'SOLUSDT', side: 'SELL', quantity: 20,    price: 195,    fee:  3.90, total: 3_900,     pnl: 600,      timestamp: new Date(Date.now() - 3 * 86400_000).toISOString() },
    { id: 't-4', symbol: 'SOLUSDT', side: 'BUY',  quantity: 42,    price: 165,    fee:  6.93, total: 6_930,     pnl: undefined, timestamp: new Date(Date.now() - 2 * 86400_000).toISOString() },
    { id: 't-5', symbol: 'BTCUSDT', side: 'SELL', quantity: 0.1,   price: 96_100, fee:  9.61, total: 9_610,     pnl: 690,      timestamp: new Date(Date.now() - 1 * 86400_000).toISOString() },
    { id: 't-6', symbol: 'BNBUSDT', side: 'BUY',  quantity: 5,     price: 588,    fee:  2.94, total: 2_940,     pnl: undefined, timestamp: new Date(Date.now() - 12 * 3600_000).toISOString() },
    { id: 't-7', symbol: 'BNBUSDT', side: 'SELL', quantity: 5,     price: 614,    fee:  3.07, total: 3_070,     pnl: 130,      timestamp: new Date(Date.now() - 4 * 3600_000).toISOString() },
  ]

  return { stats, positions, trades }
}
