'use client'

import { useState } from 'react'
import { useTradingStore } from '@/lib/store/trading'
import { orderApi } from '@/lib/api/client'
import { formatPrice } from '@/lib/utils/format'
import { AlertCircle, CheckCircle } from 'lucide-react'

type Side = 'BUY' | 'SELL'
type OType = 'MARKET' | 'LIMIT' | 'STOP'

export default function OrderPanel() {
  const { activeSymbol, tickers, portfolioStats } = useTradingStore()
  const [side, setSide]       = useState<Side>('BUY')
  const [type, setType]       = useState<OType>('MARKET')
  const [qty, setQty]         = useState('')
  const [price, setPrice]     = useState('')
  const [stop, setStop]       = useState('')
  const [submitting, setSub]  = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const ticker = tickers[activeSymbol]
  const mktPrice = ticker?.price ?? 0
  const execPrice = type === 'MARKET' ? mktPrice : parseFloat(price || '0')
  const total = parseFloat(qty || '0') * execPrice

  const setQtyPct = (pct: number) => {
    if (!portfolioStats || !mktPrice) return
    setQty(((portfolioStats.cash * pct) / (execPrice || mktPrice)).toFixed(6))
  }

  const submit = async () => {
    if (!qty || parseFloat(qty) <= 0) { setError('Enter a valid quantity'); return }
    if (type === 'LIMIT' && !price) { setError('Enter a limit price'); return }
    setSub(true); setError(null)
    try {
      await orderApi.placeOrder({
        symbol: activeSymbol, side, type,
        quantity: parseFloat(qty),
        price: type !== 'MARKET' ? parseFloat(price) : undefined,
        stopPrice: type === 'STOP' ? parseFloat(stop) : undefined,
      })
      setSuccess(true); setQty(''); setTimeout(() => setSuccess(false), 3000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Order failed')
    } finally { setSub(false) }
  }

  const isBuy = side === 'BUY'

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ height: 44, display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px', borderBottom: '1px solid var(--hairline)', flexShrink: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Place Order</span>
        <span style={{ fontSize: 11, color: 'var(--mute)' }}>{activeSymbol.replace('USDT','/USDT')}</span>
      </div>

      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Buy / Sell toggle */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, padding: 3, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--hairline)' }}>
          {(['BUY','SELL'] as Side[]).map(s => (
            <button key={s} onClick={() => setSide(s)} style={{
              padding: '8px', borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: 'pointer',
              background: side === s ? (s === 'BUY' ? 'var(--accent-green)' : 'var(--accent-red)') : 'transparent',
              color: side === s ? (s === 'BUY' ? '#000' : '#fff') : 'var(--mute)',
              border: 'none',
              boxShadow: side === s && s === 'BUY' ? '0 0 14px rgba(0,255,136,0.25)' : side === s && s === 'SELL' ? '0 0 14px rgba(255,61,90,0.25)' : 'none',
              transition: 'all 0.15s',
              letterSpacing: '0.06em',
            }}>{s} / {s === 'BUY' ? 'LONG' : 'SHORT'}</button>
          ))}
        </div>

        {/* Order type */}
        <div style={{ display: 'flex', gap: 3 }}>
          {(['MARKET','LIMIT','STOP'] as OType[]).map(t => (
            <button key={t} onClick={() => setType(t)} style={{
              flex: 1, padding: '5px 6px', borderRadius: 5, fontSize: 10, fontWeight: type === t ? 700 : 500, cursor: 'pointer',
              background: type === t ? 'rgba(0,212,255,0.08)' : 'transparent',
              border: type === t ? '1px solid rgba(0,212,255,0.22)' : '1px solid var(--hairline)',
              color: type === t ? 'var(--accent-blue)' : 'var(--mute)',
              letterSpacing: '0.04em',
            }}>{t}</button>
          ))}
        </div>

        {/* Current price */}
        {ticker && (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 6, border: '1px solid var(--hairline)' }}>
            <span style={{ fontSize: 11, color: 'var(--mute)' }}>Market Price</span>
            <span className="num" style={{ fontSize: 12, color: '#d7dde7', fontWeight: 600 }}>${formatPrice(ticker.price)}</span>
          </div>
        )}

        {/* Limit / Stop price input */}
        {type !== 'MARKET' && (
          <div>
            <label style={{ fontSize: 10, color: 'var(--mute)', display: 'block', marginBottom: 4, letterSpacing: '0.06em' }}>
              {type === 'STOP' ? 'STOP PRICE' : 'LIMIT PRICE'}
            </label>
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--hairline2)', borderRadius: 7, overflow: 'hidden' }}>
              <span style={{ padding: '0 10px', color: 'var(--mute)', fontSize: 13 }}>$</span>
              <input value={type === 'STOP' ? stop : price} onChange={e => type === 'STOP' ? setStop(e.target.value) : setPrice(e.target.value)}
                placeholder={mktPrice.toFixed(2)} type="number"
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#d7dde7', fontSize: 13, padding: '8px 10px 8px 0' }} />
            </div>
          </div>
        )}

        {/* Quantity */}
        <div>
          <label style={{ fontSize: 10, color: 'var(--mute)', display: 'block', marginBottom: 4, letterSpacing: '0.06em' }}>
            QUANTITY ({activeSymbol.replace('USDT','')})
          </label>
          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--hairline2)', borderRadius: 7, overflow: 'hidden' }}>
            <input value={qty} onChange={e => setQty(e.target.value)} placeholder="0.00" type="number"
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#d7dde7', fontSize: 13, padding: '8px 10px' }} />
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
            {[25, 50, 75, 100].map(pct => (
              <button key={pct} onClick={() => setQtyPct(pct / 100)} style={{
                flex: 1, padding: '3px 4px', borderRadius: 4, fontSize: 10, fontWeight: 600, cursor: 'pointer',
                background: 'rgba(255,255,255,0.03)', border: '1px solid var(--hairline)', color: 'var(--mute)',
              }}>{pct}%</button>
            ))}
          </div>
        </div>

        {/* Total */}
        {total > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 6, border: '1px solid var(--hairline)' }}>
            <span style={{ fontSize: 11, color: 'var(--mute)' }}>Estimated Total</span>
            <span className="num" style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        )}

        {/* Error / Success */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,61,90,0.08)', border: '1px solid rgba(255,61,90,0.2)', borderRadius: 7, padding: '7px 10px', fontSize: 11, color: 'var(--accent-red)' }}>
            <AlertCircle size={13} /> {error}
          </div>
        )}
        {success && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)', borderRadius: 7, padding: '7px 10px', fontSize: 11, color: 'var(--accent-green)' }}>
            <CheckCircle size={13} /> Order placed successfully
          </div>
        )}

        {/* Submit */}
        <button onClick={submit} disabled={submitting} style={{
          padding: '11px', borderRadius: 8, border: 'none',
          fontWeight: 700, fontSize: 13, cursor: submitting ? 'wait' : 'pointer',
          letterSpacing: '0.06em',
          background: isBuy ? 'var(--accent-green)' : 'var(--accent-red)',
          color: isBuy ? '#000' : '#fff',
          boxShadow: isBuy ? '0 0 18px rgba(0,255,136,0.2)' : '0 0 18px rgba(255,61,90,0.2)',
          opacity: submitting ? 0.65 : 1,
          transition: 'all 0.15s',
        }}>
          {submitting ? 'Placing…' : `${side} ${activeSymbol.replace('USDT','')}`}
        </button>
      </div>
    </div>
  )
}
