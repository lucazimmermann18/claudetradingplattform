'use client'

import { useState } from 'react'
import { useTradingStore } from '@/lib/store/trading'
import { orderApi } from '@/lib/api/client'
import { formatPrice } from '@/lib/utils/format'
import { ShoppingCart, AlertCircle } from 'lucide-react'

type OrderSide = 'BUY' | 'SELL'
type OrderType = 'MARKET' | 'LIMIT' | 'STOP'

export default function OrderPanel() {
  const { activeSymbol, tickers, portfolioStats } = useTradingStore()
  const [side, setSide] = useState<OrderSide>('BUY')
  const [type, setType] = useState<OrderType>('MARKET')
  const [quantity, setQuantity] = useState('')
  const [price, setPrice] = useState('')
  const [stopPrice, setStopPrice] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const ticker = tickers[activeSymbol]
  const currentPrice = ticker?.price ?? 0
  const total = parseFloat(quantity || '0') * (type === 'MARKET' ? currentPrice : parseFloat(price || '0'))

  const handleSubmit = async () => {
    if (!quantity || parseFloat(quantity) <= 0) {
      setError('Please enter a valid quantity')
      return
    }
    if (type === 'LIMIT' && !price) {
      setError('Please enter a limit price')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      await orderApi.placeOrder({
        symbol: activeSymbol,
        side,
        type,
        quantity: parseFloat(quantity),
        price: type !== 'MARKET' ? parseFloat(price) : undefined,
        stopPrice: type === 'STOP' ? parseFloat(stopPrice) : undefined,
      })
      setSuccess(true)
      setQuantity('')
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Order failed'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  const setQuantityPercent = (pct: number) => {
    if (!portfolioStats) return
    const available = portfolioStats.cash
    const qty = (available * pct) / (type === 'MARKET' ? currentPrice : parseFloat(price || String(currentPrice)))
    setQuantity(qty.toFixed(6))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px', borderBottom: '1px solid #1e2d40',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <ShoppingCart size={16} color="#00d4ff" />
        <span style={{ fontSize: 14, fontWeight: 700, color: '#e8edf5' }}>Place Order</span>
        <span style={{ fontSize: 11, color: '#4a5568', marginLeft: 4 }}>{activeSymbol}</span>
      </div>

      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Buy / Sell toggle */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <button
            onClick={() => setSide('BUY')}
            style={{
              padding: '10px', borderRadius: 8, fontWeight: 700, fontSize: 13,
              cursor: 'pointer', border: 'none', transition: 'all 0.15s',
              background: side === 'BUY' ? '#00ff88' : 'rgba(0,255,136,0.08)',
              color: side === 'BUY' ? '#000' : '#00ff88',
              boxShadow: side === 'BUY' ? '0 0 16px rgba(0,255,136,0.3)' : 'none',
            }}
          >
            BUY / LONG
          </button>
          <button
            onClick={() => setSide('SELL')}
            style={{
              padding: '10px', borderRadius: 8, fontWeight: 700, fontSize: 13,
              cursor: 'pointer', border: 'none', transition: 'all 0.15s',
              background: side === 'SELL' ? '#ff4757' : 'rgba(255,71,87,0.08)',
              color: side === 'SELL' ? '#fff' : '#ff4757',
              boxShadow: side === 'SELL' ? '0 0 16px rgba(255,71,87,0.3)' : 'none',
            }}
          >
            SELL / SHORT
          </button>
        </div>

        {/* Order type */}
        <div style={{ display: 'flex', gap: 4 }}>
          {(['MARKET', 'LIMIT', 'STOP'] as OrderType[]).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              style={{
                flex: 1, padding: '6px 8px', borderRadius: 6, fontSize: 11,
                fontWeight: type === t ? 700 : 500, cursor: 'pointer',
                background: type === t ? 'rgba(0,212,255,0.12)' : 'transparent',
                border: type === t ? '1px solid rgba(0,212,255,0.3)' : '1px solid #1e2d40',
                color: type === t ? '#00d4ff' : '#7a8da8',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Current price display */}
        {ticker && (
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontSize: 11, color: '#4a5568',
          }}>
            <span>Market Price</span>
            <span style={{ color: '#e8edf5', fontWeight: 600 }}>${formatPrice(ticker.price)}</span>
          </div>
        )}

        {/* Limit price */}
        {type !== 'MARKET' && (
          <div>
            <label style={{ fontSize: 11, color: '#4a5568', display: 'block', marginBottom: 4 }}>
              {type === 'STOP' ? 'Stop Price' : 'Limit Price'}
            </label>
            <div style={{
              display: 'flex', alignItems: 'center',
              background: '#111827', border: '1px solid #1e2d40',
              borderRadius: 8, overflow: 'hidden',
            }}>
              <span style={{ padding: '0 10px', color: '#4a5568', fontSize: 12 }}>$</span>
              <input
                value={type === 'STOP' ? stopPrice : price}
                onChange={(e) => type === 'STOP' ? setStopPrice(e.target.value) : setPrice(e.target.value)}
                placeholder={currentPrice.toFixed(2)}
                type="number"
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  color: '#e8edf5', fontSize: 13, padding: '8px 10px 8px 0',
                }}
              />
            </div>
          </div>
        )}

        {/* Quantity */}
        <div>
          <label style={{ fontSize: 11, color: '#4a5568', display: 'block', marginBottom: 4 }}>
            Quantity ({activeSymbol.replace('USDT', '')})
          </label>
          <div style={{
            display: 'flex', alignItems: 'center',
            background: '#111827', border: '1px solid #1e2d40',
            borderRadius: 8, overflow: 'hidden',
          }}>
            <input
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0.00"
              type="number"
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: '#e8edf5', fontSize: 13, padding: '8px 10px',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
            {[25, 50, 75, 100].map((pct) => (
              <button
                key={pct}
                onClick={() => setQuantityPercent(pct / 100)}
                style={{
                  flex: 1, padding: '3px 4px', borderRadius: 4, fontSize: 10,
                  fontWeight: 600, cursor: 'pointer',
                  background: 'rgba(122,141,168,0.08)',
                  border: '1px solid #1e2d40', color: '#7a8da8',
                }}
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>

        {/* Total */}
        {total > 0 && (
          <div style={{
            padding: '10px 12px',
            background: '#111827', border: '1px solid #1e2d40',
            borderRadius: 8, display: 'flex', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 12, color: '#4a5568' }}>Estimated Total</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#e8edf5' }}>
              ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.2)',
            borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#ff4757',
          }}>
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div style={{
            background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)',
            borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#00ff88',
            textAlign: 'center', fontWeight: 600,
          }}>
            Order placed successfully!
          </div>
        )}

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            padding: '12px', borderRadius: 8, border: 'none',
            fontWeight: 700, fontSize: 14, cursor: submitting ? 'wait' : 'pointer',
            background: side === 'BUY' ? '#00ff88' : '#ff4757',
            color: side === 'BUY' ? '#000' : '#fff',
            boxShadow: side === 'BUY' ? '0 0 20px rgba(0,255,136,0.25)' : '0 0 20px rgba(255,71,87,0.25)',
            opacity: submitting ? 0.7 : 1,
            transition: 'all 0.2s',
          }}
        >
          {submitting ? 'Placing Order...' : `${side} ${activeSymbol.replace('USDT', '')}`}
        </button>
      </div>
    </div>
  )
}
