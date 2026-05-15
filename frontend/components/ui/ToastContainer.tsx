'use client'

import { useEffect } from 'react'
import { useTradingStore } from '@/lib/store/trading'
import type { Toast } from '@/lib/store/trading'
import { TrendingUp, TrendingDown, Info, CheckCircle, XCircle, X } from 'lucide-react'

function ToastItem({ toast }: { toast: Toast }) {
  const removeToast = useTradingStore(s => s.removeToast)

  useEffect(() => {
    const t = setTimeout(() => removeToast(toast.id), toast.duration ?? 5000)
    return () => clearTimeout(t)
  }, [toast.id, toast.duration, removeToast])

  const meta: Record<Toast['type'], { icon: React.ReactNode; color: string; bg: string; border: string }> = {
    buy:     { icon: <TrendingUp size={14} />,   color: 'var(--accent-green)',  bg: 'rgba(0,255,136,0.07)',   border: 'rgba(0,255,136,0.2)' },
    sell:    { icon: <TrendingDown size={14} />,  color: 'var(--accent-red)',    bg: 'rgba(255,61,90,0.07)',   border: 'rgba(255,61,90,0.2)' },
    info:    { icon: <Info size={14} />,          color: 'var(--accent-blue)',   bg: 'rgba(0,212,255,0.07)',   border: 'rgba(0,212,255,0.2)' },
    success: { icon: <CheckCircle size={14} />,   color: 'var(--accent-green)',  bg: 'rgba(0,255,136,0.07)',   border: 'rgba(0,255,136,0.2)' },
    error:   { icon: <XCircle size={14} />,       color: 'var(--accent-red)',    bg: 'rgba(255,61,90,0.07)',   border: 'rgba(255,61,90,0.2)' },
  }

  const m = meta[toast.type]

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      padding: '11px 14px',
      background: 'var(--ink-900, #0d1926)',
      border: `1px solid ${m.border}`,
      borderLeft: `3px solid ${m.color}`,
      borderRadius: 10,
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      minWidth: 260, maxWidth: 320,
      animation: 'slideInRight 0.25s ease',
      backdropFilter: 'blur(12px)',
    }}>
      <span style={{ color: m.color, flexShrink: 0, marginTop: 1 }}>{m.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{toast.title}</div>
        <div style={{ fontSize: 11, color: 'var(--mute)' }}>{toast.message}</div>
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        style={{ color: 'var(--mute)', flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 1 }}
      >
        <X size={12} />
      </button>
    </div>
  )
}

export default function ToastContainer() {
  const toasts = useTradingStore(s => s.toasts)

  if (!toasts.length) return null

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24,
      display: 'flex', flexDirection: 'column', gap: 8,
      zIndex: 9999,
      pointerEvents: 'none',
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{ pointerEvents: 'auto' }}>
          <ToastItem toast={t} />
        </div>
      ))}
    </div>
  )
}
