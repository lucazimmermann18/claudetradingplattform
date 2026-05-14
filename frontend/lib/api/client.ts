import axios from 'axios'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  (r) => r,
  (err) => {
    console.error('[API]', err.response?.status, err.config?.url)
    return Promise.reject(err)
  }
)

// Market Data
export const marketApi = {
  getTicker: (symbol: string) => apiClient.get(`/api/market/ticker/${symbol}`),
  getOHLCV: (symbol: string, timeframe: string, limit = 500) =>
    apiClient.get(`/api/market/ohlcv/${symbol}`, { params: { timeframe, limit } }),
  getOrderBook: (symbol: string, depth = 20) =>
    apiClient.get(`/api/market/orderbook/${symbol}`, { params: { depth } }),
  searchSymbols: (query: string) =>
    apiClient.get('/api/market/search', { params: { q: query } }),
  getTopSymbols: () => apiClient.get('/api/market/top'),
}

// Signals
export const signalApi = {
  getSignals: (symbol?: string) =>
    apiClient.get('/api/signals', { params: { symbol } }),
  analyzeSymbol: (symbol: string, timeframe: string) =>
    apiClient.post('/api/signals/analyze', { symbol, timeframe }),
}

// Portfolio
export const portfolioApi = {
  getPositions: () => apiClient.get('/api/portfolio/positions'),
  getStats: () => apiClient.get('/api/portfolio/stats'),
  getTrades: (limit = 50) => apiClient.get('/api/portfolio/trades', { params: { limit } }),
}

// Orders
export const orderApi = {
  placeOrder: (order: {
    symbol: string
    side: 'BUY' | 'SELL'
    type: 'MARKET' | 'LIMIT' | 'STOP'
    quantity: number
    price?: number
    stopPrice?: number
  }) => apiClient.post('/api/orders', order),
  cancelOrder: (id: string) => apiClient.delete(`/api/orders/${id}`),
  getOrders: (status?: string) =>
    apiClient.get('/api/orders', { params: { status } }),
}
