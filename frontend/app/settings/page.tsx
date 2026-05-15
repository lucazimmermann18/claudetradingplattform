'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Settings, Key, Shield, Bell, Database,
  CheckCircle, Eye, EyeOff, Zap, Brain,
  RefreshCw, Trash2, Play, Star, AlertCircle,
  ChevronDown,
} from 'lucide-react'
import { adminApi } from '@/lib/api/client'

// ── Types ─────────────────────────────────────────────────────────────────
type Tab = 'ai' | 'exchange' | 'risk' | 'notifications' | 'system'

interface ProviderConfig {
  provider: string
  model: string | null
  is_active: boolean
  has_key: boolean
  key_preview: string | null
  updated_at: string | null
}

interface AvailableModels {
  claude: string[]
  openai: string[]
  deepseek: string[]
}

// ── Shared UI primitives ───────────────────────────────────────────────────
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: 11, color: 'var(--mute)', letterSpacing: '0.07em', fontWeight: 600, display: 'block', marginBottom: 6 }}>{label}</label>
      {children}
      {hint && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 5, lineHeight: 1.5 }}>{hint}</p>}
    </div>
  )
}

function SecretInput({ value, onChange, placeholder, disabled }: { value: string; onChange: (v: string) => void; placeholder?: string; disabled?: boolean }) {
  const [show, setShow] = useState(false)
  return (
    <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--hairline2)', borderRadius: 8, overflow: 'hidden' }}>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        type={show ? 'text' : 'password'} disabled={disabled}
        style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', padding: '9px 12px', color: '#d7dde7', fontSize: 13, fontFamily: 'var(--font-mono)', opacity: disabled ? 0.5 : 1 }} />
      <button onClick={() => setShow(v => !v)} style={{ padding: '0 12px', color: 'var(--mute)', background: 'none', border: 'none', cursor: 'pointer' }}>
        {show ? <EyeOff size={13} /> : <Eye size={13} />}
      </button>
    </div>
  )
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)} style={{
      width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer', flexShrink: 0,
      background: value ? 'var(--accent-green)' : 'rgba(255,255,255,0.1)', position: 'relative', transition: 'background 0.2s',
    }}>
      <span style={{ position: 'absolute', top: 3, left: value ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }} />
    </button>
  )
}

function SelectInput({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div style={{ position: 'relative' }}>
      <select value={value} onChange={e => onChange(e.target.value)} style={{
        width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--hairline2)',
        borderRadius: 8, padding: '9px 32px 9px 12px', color: '#d7dde7', fontSize: 13,
        fontFamily: 'var(--font-mono)', outline: 'none', appearance: 'none', cursor: 'pointer',
      }}>
        {options.map(o => <option key={o} value={o} style={{ background: '#0d1926' }}>{o}</option>)}
      </select>
      <ChevronDown size={13} color="var(--mute)" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
    </div>
  )
}

// ── Provider meta ──────────────────────────────────────────────────────────
const PROVIDERS = [
  {
    id: 'claude',
    name: 'Claude',
    vendor: 'Anthropic',
    color: '#cc785c',
    bg: 'rgba(204,120,92,0.08)',
    border: 'rgba(204,120,92,0.25)',
    description: 'State-of-the-art reasoning. Best for nuanced market analysis and long context.',
    docsUrl: 'https://console.anthropic.com',
    logo: '🟠',
  },
  {
    id: 'openai',
    name: 'GPT-4o',
    vendor: 'OpenAI',
    color: '#10a37f',
    bg: 'rgba(16,163,127,0.08)',
    border: 'rgba(16,163,127,0.25)',
    description: 'Versatile and fast. GPT-4o offers strong analytical capabilities at low latency.',
    docsUrl: 'https://platform.openai.com',
    logo: '🟢',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    vendor: 'DeepSeek AI',
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.08)',
    border: 'rgba(167,139,250,0.25)',
    description: 'Cost-efficient with strong reasoning. Excellent value for high-frequency analysis.',
    docsUrl: 'https://platform.deepseek.com',
    logo: '🟣',
  },
]

// ── AI Provider Card ───────────────────────────────────────────────────────
function ProviderCard({
  meta, config, models,
  onSave, onTest, onActivate, onDelete,
}: {
  meta: typeof PROVIDERS[0]
  config: ProviderConfig | undefined
  models: string[]
  onSave: (provider: string, key: string, model: string) => Promise<void>
  onTest: (provider: string, key: string, model: string) => Promise<boolean>
  onActivate: (provider: string) => Promise<void>
  onDelete: (provider: string) => Promise<void>
}) {
  const [expanded, setExpanded] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState(models[1] ?? models[0] ?? '')
  const [testing, setTesting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testResult, setTestResult] = useState<boolean | null>(null)

  const isConfigured = config?.has_key
  const isActive = config?.is_active

  const handleTest = async () => {
    if (!apiKey && !isConfigured) return
    setTesting(true); setTestResult(null)
    const ok = await onTest(meta.id, apiKey, model)
    setTestResult(ok)
    setTesting(false)
  }

  const handleSave = async () => {
    if (!apiKey) return
    setSaving(true)
    await onSave(meta.id, apiKey, model)
    setApiKey('')
    setSaving(false)
    setExpanded(false)
  }

  return (
    <div style={{
      background: isActive ? meta.bg : 'var(--ink-850)',
      border: `1px solid ${isActive ? meta.border : 'var(--hairline)'}`,
      borderRadius: 12, overflow: 'hidden',
      transition: 'all 0.2s',
      boxShadow: isActive ? `0 0 20px ${meta.bg}` : 'none',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 18px', gap: 14, cursor: 'pointer' }}
        onClick={() => setExpanded(v => !v)}>
        <div style={{ fontSize: 22, flexShrink: 0 }}>{meta.logo}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{meta.name}</span>
            <span style={{ fontSize: 10, color: 'var(--mute)', letterSpacing: '0.06em' }}>{meta.vendor}</span>
            {isActive && (
              <span style={{
                fontSize: 9, fontWeight: 800, letterSpacing: '0.12em',
                background: meta.color, color: '#000',
                borderRadius: 4, padding: '2px 6px',
              }}>ACTIVE</span>
            )}
            {isConfigured && !isActive && (
              <span style={{ fontSize: 9, color: 'var(--mute)', letterSpacing: '0.06em' }}>configured</span>
            )}
          </div>
          <div style={{ fontSize: 11, color: 'var(--mute)', marginTop: 3 }}>{meta.description}</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {isConfigured && !isActive && (
            <button onClick={e => { e.stopPropagation(); onActivate(meta.id) }} style={{
              padding: '5px 12px', borderRadius: 6, border: `1px solid ${meta.border}`,
              background: meta.bg, color: meta.color, fontSize: 11, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <Play size={10} /> Activate
            </button>
          )}
          <ChevronDown size={16} color="var(--mute)" style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </div>
      </div>

      {/* Expanded config */}
      {expanded && (
        <div style={{ padding: '0 18px 18px', borderTop: '1px solid var(--hairline)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {isConfigured && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
              background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.15)',
              borderRadius: 8,
            }}>
              <CheckCircle size={13} color="var(--accent-green)" />
              <span style={{ fontSize: 12, color: 'var(--mute)' }}>
                API key saved: <span style={{ fontFamily: 'var(--font-mono)', color: '#d7dde7' }}>{config?.key_preview}</span>
              </span>
              {config?.updated_at && (
                <span style={{ fontSize: 10, color: 'var(--mute)', marginLeft: 'auto' }}>
                  {new Date(config.updated_at).toLocaleDateString()}
                </span>
              )}
            </div>
          )}

          <Field label="API KEY" hint={`Get your key from ${meta.docsUrl}`}>
            <SecretInput value={apiKey} onChange={setApiKey} placeholder={isConfigured ? 'Enter new key to replace…' : `sk-…`} />
          </Field>

          <Field label="MODEL">
            <SelectInput value={model} onChange={setModel} options={models} />
          </Field>

          {/* Test result */}
          {testResult !== null && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8,
              background: testResult ? 'rgba(0,255,136,0.06)' : 'rgba(255,61,90,0.06)',
              border: `1px solid ${testResult ? 'rgba(0,255,136,0.2)' : 'rgba(255,61,90,0.2)'}`,
            }}>
              {testResult
                ? <><CheckCircle size={13} color="var(--accent-green)" /><span style={{ fontSize: 12, color: 'var(--accent-green)' }}>Connection successful — API key works</span></>
                : <><AlertCircle size={13} color="var(--accent-red)" /><span style={{ fontSize: 12, color: 'var(--accent-red)' }}>Connection failed — check your API key</span></>
              }
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleTest} disabled={testing || (!apiKey && !isConfigured)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 7, border: '1px solid var(--hairline)',
              background: 'rgba(255,255,255,0.03)', color: 'var(--mute)', fontSize: 12, fontWeight: 600,
              cursor: testing || (!apiKey && !isConfigured) ? 'not-allowed' : 'pointer',
              opacity: testing || (!apiKey && !isConfigured) ? 0.5 : 1,
            }}>
              <RefreshCw size={11} style={{ animation: testing ? 'spin 1s linear infinite' : 'none' }} />
              {testing ? 'Testing…' : 'Test Key'}
            </button>

            <button onClick={handleSave} disabled={saving || !apiKey} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 7, border: 'none',
              background: apiKey ? meta.color : 'rgba(255,255,255,0.06)',
              color: apiKey ? '#000' : 'var(--mute)', fontSize: 12, fontWeight: 700,
              cursor: saving || !apiKey ? 'not-allowed' : 'pointer',
            }}>
              {saving ? 'Saving…' : isConfigured ? 'Update Key' : 'Save & Configure'}
            </button>

            {isConfigured && (
              <button onClick={() => onDelete(meta.id)} style={{
                padding: '8px 12px', borderRadius: 7, border: '1px solid rgba(255,61,90,0.2)',
                background: 'rgba(255,61,90,0.05)', color: 'var(--accent-red)', cursor: 'pointer',
              }}>
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Settings page ─────────────────────────────────────────────────────
const TABS = [
  { id: 'ai',            label: 'AI Engine',      icon: Brain },
  { id: 'exchange',      label: 'Exchange API',   icon: Key },
  { id: 'risk',          label: 'Risk',           icon: Shield },
  { id: 'notifications', label: 'Notifications',  icon: Bell },
  { id: 'system',        label: 'System',         icon: Database },
] as const

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('ai')

  // AI state
  const [configs, setConfigs] = useState<ProviderConfig[]>([])
  const [availModels, setAvailModels] = useState<AvailableModels>({
    claude: ['claude-opus-4-7', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001'],
    openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
    deepseek: ['deepseek-chat', 'deepseek-reasoner'],
  })
  const [loadingAi, setLoadingAi] = useState(true)

  // Exchange state
  const [exchange, setExchange] = useState('Binance')
  const [exApiKey, setExApiKey] = useState('')
  const [exSecret, setExSecret] = useState('')
  const [testnet, setTestnet] = useState(false)

  // Notifications
  const [signalToasts, setSignalToasts] = useState(true)
  const [orderToasts, setOrderToasts] = useState(true)
  const [minConf, setMinConf] = useState(65)

  // Risk
  const [maxOrder, setMaxOrder] = useState(5)
  const [leverage, setLeverage] = useState(1)
  const [stopLoss, setStopLoss] = useState(2)

  // General
  const [saved, setSaved] = useState(false)

  const loadAiConfigs = useCallback(async () => {
    setLoadingAi(true)
    try {
      const r = await adminApi.getAiConfigs()
      setConfigs(r.data.configs ?? [])
      if (r.data.available_models) setAvailModels(r.data.available_models)
    } catch { /* mock mode */ }
    finally { setLoadingAi(false) }
  }, [])

  useEffect(() => { loadAiConfigs() }, [loadAiConfigs])

  const handleSaveProvider = async (provider: string, api_key: string, model: string) => {
    await adminApi.saveAiConfig({ provider, api_key, model, is_active: false })
    await loadAiConfigs()
  }

  const handleTestProvider = async (provider: string, api_key: string, model: string): Promise<boolean> => {
    const r = await adminApi.testAiConfig({ provider, api_key, model })
    return r.data.success === true
  }

  const handleActivate = async (provider: string) => {
    await adminApi.activateProvider(provider)
    await loadAiConfigs()
  }

  const handleDelete = async (provider: string) => {
    await adminApi.deleteAiConfig(provider)
    await loadAiConfigs()
  }

  const handleSaveSettings = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const activeProvider = configs.find(c => c.is_active)

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: '20px 24px' }}>
      <div style={{ maxWidth: 780, margin: '0 auto' }}>

        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Settings size={18} color="var(--accent-blue)" />
            <h1 style={{ fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>Settings & Admin</h1>
          </div>
          {tab !== 'ai' && (
            <button onClick={handleSaveSettings} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 8, border: 'none',
              cursor: 'pointer', fontWeight: 700, fontSize: 13, letterSpacing: '0.04em', transition: 'all 0.2s',
              background: saved ? 'rgba(0,255,136,0.15)' : 'var(--accent-blue)',
              color: saved ? 'var(--accent-green)' : '#000',
            }}>
              {saved ? <><CheckCircle size={14} /> Saved</> : 'Save Changes'}
            </button>
          )}
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 2, marginBottom: 24, background: 'var(--ink-850)', padding: 4, borderRadius: 10, border: '1px solid var(--hairline)' }}>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id as Tab)} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '8px 10px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: tab === id ? 700 : 400,
              background: tab === id ? 'rgba(0,212,255,0.1)' : 'transparent',
              color: tab === id ? 'var(--accent-blue)' : 'var(--mute)',
              outline: tab === id ? '1px solid rgba(0,212,255,0.2)' : 'none',
              transition: 'all 0.15s', whiteSpace: 'nowrap',
            }}>
              <Icon size={13} />
              <span style={{ display: 'none' }}>{label}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* ── AI Engine tab ───────────────────────────────────────────────── */}
        {tab === 'ai' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Active provider banner */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px',
              background: activeProvider
                ? PROVIDERS.find(p => p.id === activeProvider.provider)?.bg ?? 'rgba(0,255,136,0.05)'
                : 'rgba(255,255,255,0.02)',
              border: `1px solid ${activeProvider
                ? PROVIDERS.find(p => p.id === activeProvider.provider)?.border ?? 'var(--hairline)'
                : 'var(--hairline)'}`,
              borderRadius: 10,
            }}>
              <Brain size={16} color={activeProvider
                ? PROVIDERS.find(p => p.id === activeProvider.provider)?.color
                : 'var(--mute)'} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
                  {activeProvider
                    ? `${PROVIDERS.find(p => p.id === activeProvider.provider)?.name ?? activeProvider.provider} is powering your signal engine`
                    : 'No AI provider active — using pure technical analysis'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--mute)', marginTop: 2 }}>
                  {activeProvider
                    ? `Model: ${activeProvider.model} · Analyzing 10 symbols every 60 seconds`
                    : 'Configure and activate a provider below to enable AI-enhanced signals'}
                </div>
              </div>
              {activeProvider && (
                <span style={{
                  marginLeft: 'auto', fontSize: 9, fontWeight: 800, letterSpacing: '0.12em',
                  background: PROVIDERS.find(p => p.id === activeProvider.provider)?.color,
                  color: '#000', borderRadius: 4, padding: '2px 8px',
                }}>LIVE</span>
              )}
            </div>

            {/* How it works */}
            <div style={{
              padding: '12px 18px', background: 'rgba(0,212,255,0.04)',
              border: '1px solid rgba(0,212,255,0.12)', borderRadius: 10,
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-blue)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Zap size={12} /> How AI Signal Generation Works
              </div>
              <div style={{ fontSize: 11, color: 'var(--mute)', lineHeight: 1.7 }}>
                Every 60 seconds, the engine fetches OHLCV data for all watchlist symbols and computes RSI, MACD, Bollinger Bands, and EMA indicators.
                When an AI provider is active, it packages these indicators into a structured prompt and asks the AI for a trading signal (BUY/SELL/NEUTRAL),
                confidence score, reasoning, target price, and stop-loss. Without AI, the engine falls back to the built-in rule-based scoring system.
              </div>
            </div>

            {/* Provider cards */}
            {loadingAi ? (
              <div style={{ color: 'var(--mute)', fontSize: 13, textAlign: 'center', padding: 40 }}>Loading configuration…</div>
            ) : PROVIDERS.map(meta => (
              <ProviderCard
                key={meta.id}
                meta={meta}
                config={configs.find(c => c.provider === meta.id)}
                models={availModels[meta.id as keyof AvailableModels] ?? []}
                onSave={handleSaveProvider}
                onTest={handleTestProvider}
                onActivate={handleActivate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* ── Exchange API tab ────────────────────────────────────────────── */}
        {tab === 'exchange' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'var(--ink-850)', border: '1px solid var(--hairline)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '13px 18px', borderBottom: '1px solid var(--hairline)', background: 'rgba(255,255,255,0.01)' }}>
                <Key size={14} color="var(--accent-blue)" />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Exchange Connection</span>
              </div>
              <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Field label="EXCHANGE">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {['Binance', 'Bybit', 'OKX', 'Kraken', 'Coinbase Advanced', 'Bitget'].map(ex => (
                      <button key={ex} onClick={() => setExchange(ex)} style={{
                        padding: '6px 14px', borderRadius: 7, fontSize: 12, fontWeight: exchange === ex ? 700 : 400,
                        cursor: 'pointer', border: 'none',
                        background: exchange === ex ? 'rgba(0,212,255,0.1)' : 'rgba(255,255,255,0.03)',
                        color: exchange === ex ? 'var(--accent-blue)' : 'var(--mute)',
                        outline: exchange === ex ? '1px solid rgba(0,212,255,0.3)' : '1px solid var(--hairline)',
                      }}>{ex}</button>
                    ))}
                  </div>
                </Field>

                <Field label="API KEY" hint="Read + Trade permissions required. Keep this confidential.">
                  <SecretInput value={exApiKey} onChange={setExApiKey} placeholder="Enter your API key…" />
                </Field>

                <Field label="API SECRET">
                  <SecretInput value={exSecret} onChange={setExSecret} placeholder="Enter your API secret…" />
                </Field>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 13, color: '#d7dde7', fontWeight: 500 }}>Paper Trading / Testnet</div>
                    <div style={{ fontSize: 11, color: 'var(--mute)', marginTop: 2 }}>Sandbox mode — no real funds at risk</div>
                  </div>
                  <Toggle value={testnet} onChange={setTestnet} />
                </div>

                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
                  background: 'rgba(255,255,255,0.02)', border: '1px solid var(--hairline)', borderRadius: 8,
                }}>
                  <span style={{
                    width: 7, height: 7, borderRadius: '50%', display: 'inline-block', flexShrink: 0,
                    background: exApiKey ? 'var(--accent-amber)' : 'rgba(255,255,255,0.12)',
                  }} />
                  <span style={{ fontSize: 12, color: 'var(--mute)' }}>
                    {exApiKey ? 'API key entered — save to connect' : 'No exchange API configured — running in mock mode'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Risk tab ────────────────────────────────────────────────────── */}
        {tab === 'risk' && (
          <div style={{ background: 'var(--ink-850)', border: '1px solid var(--hairline)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '13px 18px', borderBottom: '1px solid var(--hairline)', background: 'rgba(255,255,255,0.01)' }}>
              <Shield size={14} color="var(--accent-blue)" />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Risk Management</span>
            </div>
            <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 18 }}>
              <Field label="MAX ORDER SIZE (% OF PORTFOLIO)" hint="Each order is capped at this percentage of total portfolio value">
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 4 }}>
                  <input type="range" min={1} max={25} value={maxOrder} onChange={e => setMaxOrder(Number(e.target.value))}
                    style={{ flex: 1, accentColor: 'var(--accent-amber)' }} />
                  <span className="num" style={{ fontSize: 16, color: 'var(--accent-amber)', fontWeight: 700, minWidth: 40, textAlign: 'right' }}>{maxOrder}%</span>
                </div>
              </Field>

              <Field label="DEFAULT LEVERAGE" hint="1× = spot equivalent. Higher leverage increases both profit and loss potential.">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                  {[1, 2, 3, 5, 10, 20].map(lev => (
                    <button key={lev} onClick={() => setLeverage(lev)} style={{
                      padding: '6px 18px', borderRadius: 7, fontSize: 13, fontWeight: leverage === lev ? 700 : 400,
                      cursor: 'pointer', border: 'none',
                      background: leverage === lev ? 'rgba(255,184,0,0.12)' : 'rgba(255,255,255,0.03)',
                      color: leverage === lev ? 'var(--accent-amber)' : 'var(--mute)',
                      outline: leverage === lev ? '1px solid rgba(255,184,0,0.3)' : '1px solid var(--hairline)',
                    }}>{lev}×</button>
                  ))}
                </div>
              </Field>

              <Field label="DEFAULT STOP LOSS (%)" hint="Auto-applied to new orders when no stop price is set">
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 4 }}>
                  <input type="range" min={0.5} max={10} step={0.5} value={stopLoss} onChange={e => setStopLoss(Number(e.target.value))}
                    style={{ flex: 1, accentColor: 'var(--accent-red)' }} />
                  <span className="num" style={{ fontSize: 16, color: 'var(--accent-red)', fontWeight: 700, minWidth: 40, textAlign: 'right' }}>{stopLoss}%</span>
                </div>
              </Field>
            </div>
          </div>
        )}

        {/* ── Notifications tab ───────────────────────────────────────────── */}
        {tab === 'notifications' && (
          <div style={{ background: 'var(--ink-850)', border: '1px solid var(--hairline)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '13px 18px', borderBottom: '1px solid var(--hairline)', background: 'rgba(255,255,255,0.01)' }}>
              <Bell size={14} color="var(--accent-blue)" />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Notifications</span>
            </div>
            <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'Signal Alerts', desc: 'Toast notification when a new AI signal is generated', value: signalToasts, onChange: setSignalToasts },
                { label: 'Order Confirmations', desc: 'Toast on order fill or cancel', value: orderToasts, onChange: setOrderToasts },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 13, color: '#d7dde7', fontWeight: 500 }}>{row.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--mute)', marginTop: 2 }}>{row.desc}</div>
                  </div>
                  <Toggle value={row.value} onChange={row.onChange} />
                </div>
              ))}

              <Field label="MINIMUM SIGNAL CONFIDENCE" hint={`Only alert when signal confidence ≥ ${minConf}%`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 4 }}>
                  <input type="range" min={50} max={95} value={minConf} onChange={e => setMinConf(Number(e.target.value))}
                    style={{ flex: 1, accentColor: 'var(--accent-blue)' }} />
                  <span className="num" style={{ fontSize: 16, color: 'var(--accent-blue)', fontWeight: 700, minWidth: 40, textAlign: 'right' }}>{minConf}%</span>
                </div>
              </Field>
            </div>
          </div>
        )}

        {/* ── System tab ──────────────────────────────────────────────────── */}
        {tab === 'system' && (
          <div style={{ background: 'var(--ink-850)', border: '1px solid var(--hairline)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '13px 18px', borderBottom: '1px solid var(--hairline)', background: 'rgba(255,255,255,0.01)' }}>
              <Database size={14} color="var(--accent-blue)" />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>System Info</span>
            </div>
            <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                { label: 'Data Mode',        value: 'Mock simulation (no exchange API)', color: 'var(--accent-amber)' },
                { label: 'Backend URL',      value: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000', color: 'var(--mute)' },
                { label: 'Signal Engine',    value: activeProvider ? `AI — ${activeProvider.provider}/${activeProvider.model}` : 'Rule-based TA (RSI · MACD · BB · EMA)', color: activeProvider ? 'var(--accent-green)' : 'var(--mute)' },
                { label: 'Signal Interval',  value: '60 seconds', color: 'var(--mute)' },
                { label: 'Symbols Tracked',  value: '10 (BTC, ETH, SOL, BNB, XRP, ADA, AVAX, DOT, LINK, MATIC)', color: 'var(--mute)' },
                { label: 'Ticker Refresh',   value: '1 second (mock) / WebSocket (live)', color: 'var(--mute)' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid var(--hairline)' }}>
                  <span style={{ fontSize: 12, color: 'var(--mute)' }}>{row.label}</span>
                  <span style={{ fontSize: 12, color: row.color, fontFamily: 'var(--font-mono)', textAlign: 'right', maxWidth: '55%' }}>{row.value}</span>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button style={{
                  flex: 1, padding: '9px', borderRadius: 7, border: '1px solid var(--hairline)',
                  background: 'rgba(255,255,255,0.02)', color: 'var(--mute)', fontSize: 12, cursor: 'pointer', fontWeight: 500,
                }}>Clear Local Cache</button>
                <button style={{
                  flex: 1, padding: '9px', borderRadius: 7, border: '1px solid rgba(255,61,90,0.2)',
                  background: 'rgba(255,61,90,0.05)', color: 'var(--accent-red)', fontSize: 12, cursor: 'pointer', fontWeight: 500,
                }}>Reset All Settings</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
