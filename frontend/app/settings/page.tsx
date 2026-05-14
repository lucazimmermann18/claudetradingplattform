'use client'

import { useState } from 'react'
import { Settings, Key, Globe, Shield, Bell, Database, ChevronRight, CheckCircle, Eye, EyeOff, Zap } from 'lucide-react'

type Section = 'exchange' | 'notifications' | 'risk' | 'system'

const EXCHANGES = ['Binance', 'Bybit', 'OKX', 'Kraken', 'Coinbase Advanced', 'Bitget']

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--ink-850)', border: '1px solid var(--hairline)', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '13px 18px', borderBottom: '1px solid var(--hairline)', background: 'rgba(255,255,255,0.01)' }}>
        <span style={{ color: 'var(--accent-blue)' }}>{icon}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{title}</span>
      </div>
      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {children}
      </div>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: 11, color: 'var(--mute)', letterSpacing: '0.07em', fontWeight: 600, display: 'block', marginBottom: 6 }}>{label}</label>
      {children}
      {hint && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>{hint}</p>}
    </div>
  )
}

function TextInput({ value, onChange, placeholder, type = 'text' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} type={type}
      style={{
        width: '100%', boxSizing: 'border-box',
        background: 'rgba(255,255,255,0.03)', border: '1px solid var(--hairline2)',
        borderRadius: 8, padding: '9px 12px',
        color: '#d7dde7', fontSize: 13, outline: 'none',
        fontFamily: 'var(--font-mono)',
      }} />
  )
}

function SecretInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [show, setShow] = useState(false)
  return (
    <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--hairline2)', borderRadius: 8, overflow: 'hidden' }}>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} type={show ? 'text' : 'password'}
        style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', padding: '9px 12px', color: '#d7dde7', fontSize: 13, fontFamily: 'var(--font-mono)' }} />
      <button onClick={() => setShow(v => !v)} style={{ padding: '0 12px', color: 'var(--mute)', background: 'none', border: 'none', cursor: 'pointer' }}>
        {show ? <EyeOff size={13} /> : <Eye size={13} />}
      </button>
    </div>
  )
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)} style={{
      width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
      background: value ? 'var(--accent-green)' : 'rgba(255,255,255,0.1)',
      position: 'relative', transition: 'background 0.2s', flexShrink: 0,
    }}>
      <span style={{
        position: 'absolute', top: 3, left: value ? 21 : 3,
        width: 16, height: 16, borderRadius: '50%',
        background: '#fff', transition: 'left 0.2s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
      }} />
    </button>
  )
}

function NumberInput({ value, onChange, min, max, step }: { value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number }) {
  return (
    <input type="number" value={value} onChange={e => onChange(parseFloat(e.target.value))} min={min} max={max} step={step}
      style={{
        width: '100%', boxSizing: 'border-box',
        background: 'rgba(255,255,255,0.03)', border: '1px solid var(--hairline2)',
        borderRadius: 8, padding: '9px 12px',
        color: '#d7dde7', fontSize: 13, outline: 'none', fontFamily: 'var(--font-mono)',
      }} />
  )
}

export default function SettingsPage() {
  const [exchange, setExchange]   = useState('Binance')
  const [apiKey, setApiKey]       = useState('')
  const [apiSecret, setApiSecret] = useState('')
  const [testnet, setTestnet]     = useState(false)
  const [saved, setSaved]         = useState(false)

  // Notifications
  const [signalToasts, setSignalToasts]       = useState(true)
  const [orderToasts, setOrderToasts]         = useState(true)
  const [minConfidence, setMinConfidence]     = useState(65)

  // Risk
  const [maxOrderSize, setMaxOrderSize]       = useState(5)
  const [defaultLeverage, setDefaultLeverage] = useState(1)
  const [stopLossDefault, setStopLossDefault] = useState(2)

  const handleSave = () => {
    // In a real app this would POST to the backend
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: '20px 24px', maxWidth: 720 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Settings size={18} color="var(--accent-blue)" />
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>Settings</h1>
        </div>
        <button onClick={handleSave} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
          background: saved ? 'rgba(0,255,136,0.15)' : 'var(--accent-blue)',
          color: saved ? 'var(--accent-green)' : '#000',
          fontWeight: 700, fontSize: 13, letterSpacing: '0.04em',
          transition: 'all 0.2s',
        }}>
          {saved ? <><CheckCircle size={14} /> Saved</> : 'Save Changes'}
        </button>
      </div>

      {/* Exchange API */}
      <SectionCard title="Exchange API" icon={<Key size={14} />}>
        <Field label="EXCHANGE">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {EXCHANGES.map(ex => (
              <button key={ex} onClick={() => setExchange(ex)} style={{
                padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: exchange === ex ? 700 : 400,
                cursor: 'pointer', border: 'none',
                background: exchange === ex ? 'rgba(0,212,255,0.12)' : 'rgba(255,255,255,0.03)',
                color: exchange === ex ? 'var(--accent-blue)' : 'var(--mute)',
                outline: exchange === ex ? '1px solid rgba(0,212,255,0.3)' : '1px solid var(--hairline)',
                transition: 'all 0.15s',
              }}>{ex}</button>
            ))}
          </div>
        </Field>

        <Field label="API KEY" hint="Read + Trade permissions required. Never share this key.">
          <TextInput value={apiKey} onChange={setApiKey} placeholder="Enter your API key…" />
        </Field>

        <Field label="API SECRET">
          <SecretInput value={apiSecret} onChange={setApiSecret} placeholder="Enter your API secret…" />
        </Field>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, color: '#d7dde7', fontWeight: 500 }}>Testnet / Paper Trading</div>
            <div style={{ fontSize: 11, color: 'var(--mute)', marginTop: 2 }}>Use sandbox environment — no real funds</div>
          </div>
          <Toggle value={testnet} onChange={setTestnet} />
        </div>

        {/* Connection status indicator */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '9px 13px',
          background: 'rgba(255,255,255,0.02)', border: '1px solid var(--hairline)', borderRadius: 8,
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: apiKey ? 'var(--accent-amber)' : 'rgba(255,255,255,0.12)', display: 'inline-block' }} />
          <span style={{ fontSize: 12, color: 'var(--mute)' }}>
            {apiKey ? 'API key entered — save to connect' : 'No API configured — running in mock mode'}
          </span>
        </div>
      </SectionCard>

      {/* Notifications */}
      <SectionCard title="Notifications" icon={<Bell size={14} />}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, color: '#d7dde7', fontWeight: 500 }}>Signal Alerts</div>
            <div style={{ fontSize: 11, color: 'var(--mute)', marginTop: 2 }}>Toast when a new AI signal is generated</div>
          </div>
          <Toggle value={signalToasts} onChange={setSignalToasts} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, color: '#d7dde7', fontWeight: 500 }}>Order Confirmations</div>
            <div style={{ fontSize: 11, color: 'var(--mute)', marginTop: 2 }}>Toast on order fill or cancel</div>
          </div>
          <Toggle value={orderToasts} onChange={setOrderToasts} />
        </div>

        <Field label="MINIMUM SIGNAL CONFIDENCE" hint={`Only alert for signals with ≥${minConfidence}% confidence`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input type="range" min={50} max={95} value={minConfidence} onChange={e => setMinConfidence(Number(e.target.value))}
              style={{ flex: 1, accentColor: 'var(--accent-blue)' }} />
            <span className="num" style={{ fontSize: 13, color: 'var(--accent-blue)', fontWeight: 700, minWidth: 36, textAlign: 'right' }}>
              {minConfidence}%
            </span>
          </div>
        </Field>
      </SectionCard>

      {/* Risk Management */}
      <SectionCard title="Risk Management" icon={<Shield size={14} />}>
        <Field label="MAX ORDER SIZE (% OF PORTFOLIO)" hint="Each order is capped at this percentage of total portfolio value">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input type="range" min={1} max={25} value={maxOrderSize} onChange={e => setMaxOrderSize(Number(e.target.value))}
              style={{ flex: 1, accentColor: 'var(--accent-amber)' }} />
            <span className="num" style={{ fontSize: 13, color: 'var(--accent-amber)', fontWeight: 700, minWidth: 36, textAlign: 'right' }}>
              {maxOrderSize}%
            </span>
          </div>
        </Field>

        <Field label="DEFAULT LEVERAGE" hint="Applies to futures/margin orders. 1x = spot equivalent">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {[1, 2, 3, 5, 10].map(lev => (
              <button key={lev} onClick={() => setDefaultLeverage(lev)} style={{
                padding: '5px 14px', borderRadius: 6, fontSize: 12, fontWeight: defaultLeverage === lev ? 700 : 400,
                cursor: 'pointer', border: 'none',
                background: defaultLeverage === lev ? 'rgba(255,184,0,0.12)' : 'rgba(255,255,255,0.03)',
                color: defaultLeverage === lev ? 'var(--accent-amber)' : 'var(--mute)',
                outline: defaultLeverage === lev ? '1px solid rgba(255,184,0,0.3)' : '1px solid var(--hairline)',
              }}>{lev}×</button>
            ))}
          </div>
        </Field>

        <Field label="DEFAULT STOP LOSS (%)" hint="Auto-applied to new orders if stop price is not set manually">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input type="range" min={0.5} max={10} step={0.5} value={stopLossDefault} onChange={e => setStopLossDefault(Number(e.target.value))}
              style={{ flex: 1, accentColor: 'var(--accent-red)' }} />
            <span className="num" style={{ fontSize: 13, color: 'var(--accent-red)', fontWeight: 700, minWidth: 36, textAlign: 'right' }}>
              {stopLossDefault}%
            </span>
          </div>
        </Field>
      </SectionCard>

      {/* System */}
      <SectionCard title="System" icon={<Database size={14} />}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { label: 'Mock Mode', value: 'Active — no API connected', color: 'var(--accent-amber)' },
            { label: 'Backend', value: 'http://localhost:8000', color: 'var(--mute)' },
            { label: 'Signal Engine', value: 'RSI · MACD · Bollinger · EMA', color: 'var(--mute)' },
            { label: 'Data Sources', value: 'Mock GBM simulation (live)', color: 'var(--accent-green)' },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--hairline)' }}>
              <span style={{ fontSize: 12, color: 'var(--mute)' }}>{row.label}</span>
              <span style={{ fontSize: 12, color: row.color, fontFamily: 'var(--font-mono)' }}>{row.value}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button style={{
            flex: 1, padding: '8px', borderRadius: 7, border: '1px solid var(--hairline)',
            background: 'rgba(255,255,255,0.02)', color: 'var(--mute)', fontSize: 12,
            cursor: 'pointer', fontWeight: 500,
          }}>
            Clear Cache
          </button>
          <button style={{
            flex: 1, padding: '8px', borderRadius: 7, border: '1px solid rgba(255,61,90,0.2)',
            background: 'rgba(255,61,90,0.05)', color: 'var(--accent-red)', fontSize: 12,
            cursor: 'pointer', fontWeight: 500,
          }}>
            Reset All Settings
          </button>
        </div>
      </SectionCard>
    </div>
  )
}
