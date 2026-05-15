'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTradingStore } from '@/lib/store/trading'
import {
  LayoutDashboard, LineChart, Zap, TrendingUp, History, Settings,
  ChevronLeft, ChevronRight, Star, LayoutGrid,
} from 'lucide-react'

const NAV = [
  { href: '/dashboard',   label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/chart',       label: 'Chart',        icon: LineChart },
  { href: '/multichart',  label: 'Multi-Chart',  icon: LayoutGrid },
  { href: '/signals',     label: 'AI Signals',   icon: Zap,       badge: 'LIVE' },
  { href: '/watchlist',   label: 'Watchlist',    icon: Star },
  { href: '/portfolio',   label: 'Portfolio',    icon: TrendingUp },
  { href: '/history',     label: 'History',      icon: History },
  { href: '/settings',    label: 'Admin',        icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { sidebarCollapsed, toggleSidebar, connected } = useTradingStore()
  const W = sidebarCollapsed ? 60 : 216

  return (
    <aside style={{
      width: W, flexShrink: 0, position: 'relative', zIndex: 10,
      background: 'var(--ink-900)',
      borderRight: '1px solid var(--hairline)',
      display: 'flex', flexDirection: 'column',
      transition: 'width 0.2s ease',
    }}>
      {/* Logo */}
      <div style={{
        height: 56, display: 'flex', alignItems: 'center',
        padding: sidebarCollapsed ? '0' : '0 16px',
        justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
        borderBottom: '1px solid var(--hairline)',
        gap: 10, flexShrink: 0,
      }}>
        {/* Icon mark */}
        <div style={{
          width: 30, height: 30, borderRadius: 8, flexShrink: 0,
          background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-green))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M1 12 L5 6 L8 9 L11 4 L15 12" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        {!sidebarCollapsed && (
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.02em', color: '#fff', lineHeight: 1 }}>
              TradeAI <span style={{ color: 'var(--accent-blue)' }}>Pro</span>
            </div>
            <div style={{ fontSize: 9, color: 'var(--mute)', letterSpacing: '0.14em', marginTop: 2 }}>
              SIGNAL ENGINE
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px 6px', display: 'flex', flexDirection: 'column', gap: 1 }}>
        {NAV.map(({ href, label, icon: Icon, badge }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href} title={sidebarCollapsed ? label : undefined} style={{
              display: 'flex', alignItems: 'center',
              gap: 8, padding: sidebarCollapsed ? '9px 0' : '9px 10px',
              borderRadius: 7, textDecoration: 'none',
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              background: active ? 'rgba(0,212,255,0.08)' : 'transparent',
              border: active ? '1px solid rgba(0,212,255,0.18)' : '1px solid transparent',
              color: active ? 'var(--accent-blue)' : 'var(--mute)',
              fontSize: 13, fontWeight: active ? 600 : 400,
              transition: 'all 0.15s',
              overflow: 'hidden', whiteSpace: 'nowrap',
            }}>
              <Icon size={15} strokeWidth={active ? 2.5 : 1.8} style={{ flexShrink: 0 }} />
              {!sidebarCollapsed && (
                <>
                  <span style={{ flex: 1 }}>{label}</span>
                  {badge && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
                      background: 'var(--accent-blue)', color: 'var(--ink-950)',
                      borderRadius: 3, padding: '1px 5px',
                    }}>{badge}</span>
                  )}
                </>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Connection */}
      <div style={{
        padding: sidebarCollapsed ? '12px 0' : '12px 16px',
        borderTop: '1px solid var(--hairline)',
        display: 'flex', alignItems: 'center', gap: 7,
        justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
        flexShrink: 0,
      }}>
        <span className="dot animate-pulseDot" style={{
          background: connected ? 'var(--accent-green)' : 'var(--accent-red)',
          boxShadow: connected ? '0 0 6px var(--accent-green)' : 'none',
        }} />
        {!sidebarCollapsed && (
          <span style={{ fontSize: 11, color: 'var(--mute)' }}>
            {connected ? 'Connected' : 'Reconnecting...'}
          </span>
        )}
      </div>

      {/* Collapse toggle */}
      <button onClick={toggleSidebar} style={{
        position: 'absolute', right: -11, top: '50%', transform: 'translateY(-50%)',
        width: 22, height: 22, borderRadius: '50%',
        background: 'var(--ink-800)', border: '1px solid var(--hairline2)',
        color: 'var(--mute)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 20, cursor: 'pointer',
      }}>
        {sidebarCollapsed ? <ChevronRight size={11} /> : <ChevronLeft size={11} />}
      </button>
    </aside>
  )
}
