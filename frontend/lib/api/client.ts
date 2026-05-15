import axios from 'axios'
import { generateOHLCV, generateOrderBook, generateSignals, generatePortfolio, BASE, tickPrice } from '@/lib/mock'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// True when backend answered at least once
let backendAvailable = false

export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 3000,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  (r) => { backendAvailable = true; return r },
  (err) => Promise.reject(err),
)

// ── Mock helpers ──────────────────────────────────────────────────────────
function mockOk(data: unknown) {
  return Promise.resolve({ data, status: 200, statusText: 'OK', headers: {}, config: {} as never })
}

// ── Market API ────────────────────────────────────────────────────────────
export const marketApi = {
  getTicker: async (symbol: string) => {
    try { return await apiClient.get(`/api/market/ticker/${symbol}`) }
    catch { return mockOk(tickPrice(symbol)) }
  },

  getOHLCV: async (symbol: string, timeframe: string, limit = 500) => {
    try { return await apiClient.get(`/api/market/ohlcv/${symbol}`, { params: { timeframe, limit } }) }
    catch { return mockOk({ symbol, timeframe, data: generateOHLCV(symbol, timeframe, limit) }) }
  },

  getOrderBook: async (symbol: string, depth = 12) => {
    try { return await apiClient.get(`/api/market/orderbook/${symbol}`, { params: { depth } }) }
    catch { return mockOk(generateOrderBook(symbol, depth)) }
  },

  searchSymbols: async (query: string) => {
    try { return await apiClient.get('/api/market/search', { params: { q: query } }) }
    catch { return mockOk({ results: Object.keys(BASE).filter(s => s.includes(query.toUpperCase())) }) }
  },

  getTopSymbols: async () => {
    try { return await apiClient.get('/api/market/top') }
    catch { return mockOk({ symbols: Object.keys(BASE) }) }
  },
}

// ── Signal API ────────────────────────────────────────────────────────────
export const signalApi = {
  getSignals: async (symbol?: string) => {
    try { return await apiClient.get('/api/signals', { params: { symbol } }) }
    catch {
      const sigs = generateSignals(Object.keys(BASE))
      return mockOk({ signals: symbol ? sigs.filter(s => s.symbol === symbol) : sigs, count: sigs.length })
    }
  },

  analyzeSymbol: async (symbol: string, timeframe: string) => {
    try { return await apiClient.post('/api/signals/analyze', { symbol, timeframe }) }
    catch {
      const [sig] = generateSignals([symbol])
      return mockOk({ signal: sig })
    }
  },
}

// ── Portfolio API ─────────────────────────────────────────────────────────
export const portfolioApi = {
  getPositions: async () => {
    try { return await apiClient.get('/api/portfolio/positions') }
    catch { return mockOk({ positions: generatePortfolio().positions }) }
  },

  getStats: async () => {
    try { return await apiClient.get('/api/portfolio/stats') }
    catch { return mockOk(generatePortfolio().stats) }
  },

  getTrades: async (limit = 50) => {
    try { return await apiClient.get('/api/portfolio/trades', { params: { limit } }) }
    catch { return mockOk({ trades: generatePortfolio().trades }) }
  },
}

// ── Order API ─────────────────────────────────────────────────────────────
export const orderApi = {
  placeOrder: async (order: {
    symbol: string; side: 'BUY' | 'SELL'; type: 'MARKET' | 'LIMIT' | 'STOP'
    quantity: number; price?: number; stopPrice?: number
  }) => {
    try { return await apiClient.post('/api/orders', order) }
    catch {
      // Simulate fill
      const price = order.price ?? tickPrice(order.symbol).price
      return mockOk({
        id: `mock-order-${Date.now()}`,
        ...order, fillPrice: price,
        total: price * order.quantity,
        fee: price * order.quantity * 0.001,
        status: 'FILLED',
        createdAt: new Date().toISOString(),
      })
    }
  },

  cancelOrder: async (id: string) => {
    try { return await apiClient.delete(`/api/orders/${id}`) }
    catch { return mockOk({ message: 'Order cancelled', id }) }
  },

  getOrders: async (status?: string) => {
    try { return await apiClient.get('/api/orders', { params: { status } }) }
    catch { return mockOk({ orders: [] }) }
  },
}

// ── Admin / AI Config API ──────────────────────────────────────────────────
export const adminApi = {
  getAiConfigs: async () => {
    try { return await apiClient.get('/api/admin/ai-config') }
    catch {
      return mockOk({
        configs: [],
        available_models: {
          claude:   ['claude-opus-4-7', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001'],
          openai:   ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
          deepseek: ['deepseek-chat', 'deepseek-reasoner'],
        },
      })
    }
  },

  saveAiConfig: async (payload: { provider: string; api_key: string; model: string; is_active: boolean }) => {
    try { return await apiClient.post('/api/admin/ai-config', payload) }
    catch { return mockOk({ success: true, ...payload }) }
  },

  testAiConfig: async (payload: { provider: string; api_key: string; model: string }) => {
    try { return await apiClient.post('/api/admin/ai-config/test', payload) }
    catch { return mockOk({ success: false }) }
  },

  activateProvider: async (provider: string) => {
    try { return await apiClient.post(`/api/admin/ai-config/${provider}/activate`) }
    catch { return mockOk({ success: true, active_provider: provider }) }
  },

  deleteAiConfig: async (provider: string) => {
    try { return await apiClient.delete(`/api/admin/ai-config/${provider}`) }
    catch { return mockOk({ success: true }) }
  },

  getActiveProvider: async () => {
    try { return await apiClient.get('/api/admin/ai-config/active') }
    catch { return mockOk({ active: false, provider: null, model: null }) }
  },
}
