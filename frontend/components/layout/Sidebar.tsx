'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTradingStore } from '@/lib/store/trading'
import {
  LayoutDashboard,
  LineChart,
  Zap,
  BookOpen,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/chart', label: 'Chart', icon: LineChart },
  { href: '/signals', label: 'AI Signals', icon: Zap },
  { href: '/portfolio', label: 'Portfolio', icon: TrendingUp },
  { href: '/history', label: 'History', icon: History },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { sidebarCollapsed, toggleSidebar, connected } = useTradingStore()

  return (
    <aside
      style={{
        width: sidebarCollapsed ? '64px' : '220px',
        background: '#0d1117',
        borderRight: '1px solid #1e2d40',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s ease',
        flexShrink: 0,
        position: 'relative',
        zIndex: 10,
      }}
    >
      {/* Logo */}
      <div style={{
        padding: sidebarCollapsed ? '20px 0' : '20px 20px',
        borderBottom: '1px solid #1e2d40',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        overflow: 'hidden',
        justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '8px',
          background: 'linear-gradient(135deg, #00d4ff, #00ff88)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <TrendingUp size={18} color="#000" strokeWidth={2.5} />
        </div>
        {!sidebarCollapsed && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#e8edf5', letterSpacing: '-0.3px' }}>
              TradeAI <span style={{ color: '#00d4ff' }}>Pro</span>
            </div>
            <div style={{ fontSize: 9, color: '#4a5568', letterSpacing: '1.5px', fontWeight: 600 }}>
              SIGNAL ENGINE
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: sidebarCollapsed ? '10px 0' : '10px 12px',
                borderRadius: '8px',
                textDecoration: 'none',
                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                background: active ? 'rgba(0,212,255,0.1)' : 'transparent',
                border: active ? '1px solid rgba(0,212,255,0.2)' : '1px solid transparent',
                color: active ? '#00d4ff' : '#7a8da8',
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                transition: 'all 0.15s',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}
              title={sidebarCollapsed ? label : undefined}
            >
              <Icon size={16} strokeWidth={active ? 2.5 : 2} style={{ flexShrink: 0 }} />
              {!sidebarCollapsed && label}
              {!sidebarCollapsed && label === 'AI Signals' && (
                <span style={{
                  marginLeft: 'auto',
                  background: '#00d4ff',
                  color: '#000',
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: 4,
                }}>LIVE</span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Connection status */}
      <div style={{
        padding: sidebarCollapsed ? '12px 0' : '12px 20px',
        borderTop: '1px solid #1e2d40',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
      }}>
        <div style={{
          width: 7, height: 7,
          borderRadius: '50%',
          background: connected ? '#00ff88' : '#ff4757',
          boxShadow: connected ? '0 0 6px #00ff88' : '0 0 6px #ff4757',
          animation: connected ? 'pulse-dot 2s ease-in-out infinite' : 'none',
          flexShrink: 0,
        }} />
        {!sidebarCollapsed && (
          <span style={{ fontSize: 11, color: '#4a5568', fontWeight: 500 }}>
            {connected ? 'Connected' : 'Reconnecting...'}
          </span>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        style={{
          position: 'absolute',
          right: -12,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 24, height: 24,
          borderRadius: '50%',
          background: '#1e2d40',
          border: '1px solid #253347',
          color: '#7a8da8',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 20,
        }}
      >
        {sidebarCollapsed
          ? <ChevronRight size={12} />
          : <ChevronLeft size={12} />}
      </button>
    </aside>
  )
}
