export function formatPrice(price: number, decimals?: number): string {
  if (price >= 1000) {
    return price.toLocaleString('en-US', {
      minimumFractionDigits: decimals ?? 2,
      maximumFractionDigits: decimals ?? 2,
    })
  }
  if (price >= 1) {
    return price.toFixed(decimals ?? 4)
  }
  return price.toFixed(decimals ?? 6)
}

export function formatChange(change: number, percent: number): string {
  const sign = change >= 0 ? '+' : ''
  return `${sign}${change.toFixed(2)} (${sign}${percent.toFixed(2)}%)`
}

export function formatVolume(volume: number): string {
  if (volume >= 1e9) return `${(volume / 1e9).toFixed(2)}B`
  if (volume >= 1e6) return `${(volume / 1e6).toFixed(2)}M`
  if (volume >= 1e3) return `${(volume / 1e3).toFixed(2)}K`
  return volume.toFixed(2)
}

export function formatPnl(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

export function formatTime(timestamp: string | number): string {
  const d = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp * 1000)
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function formatDate(timestamp: string | number): string {
  const d = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp * 1000)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function getChangeClass(value: number): string {
  if (value > 0) return 'text-positive'
  if (value < 0) return 'text-negative'
  return 'text-neutral'
}

export function symbolToName(symbol: string): string {
  const names: Record<string, string> = {
    BTCUSDT: 'Bitcoin',
    ETHUSDT: 'Ethereum',
    SOLUSDT: 'Solana',
    BNBUSDT: 'BNB',
    XRPUSDT: 'XRP',
    ADAUSDT: 'Cardano',
    DOTUSDT: 'Polkadot',
    AVAXUSDT: 'Avalanche',
    MATICUSDT: 'Polygon',
    LINKUSDT: 'Chainlink',
    LTCUSDT: 'Litecoin',
    DOGEUSDT: 'Dogecoin',
    ATOMUSDT: 'Cosmos',
    UNIUSDT: 'Uniswap',
    APTUSDT: 'Aptos',
  }
  return names[symbol] ?? symbol.replace('USDT', '')
}
