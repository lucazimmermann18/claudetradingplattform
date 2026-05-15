'use client'

import dynamic from 'next/dynamic'
import { useTradingStore } from '@/lib/store/trading'
import { LayoutGrid, Grid3x3 } from 'lucide-react'

const MiniChart = dynamic(() => import('@/components/chart/MiniChart'), { ssr: false })

export default function MultiChartPage() {
  const { multiChartSymbols, setMultiChartSymbols, multiChartLayout, setMultiChartLayout } = useTradingStore()

  const count = multiChartLayout === '2x2' ? 4 : 6
  const cols  = multiChartLayout === '2x2' ? 2 : 3
  const rows  = 2
  const displayed = multiChartSymbols.slice(0, count)

  const changeSymbol = (index: number, symbol: string) => {
    const next = [...multiChartSymbols]
    next[index] = symbol
    setMultiChartSymbols(next)
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{
        height: 44, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12,
        padding: '0 16px', borderBottom: '1px solid var(--hairline)',
        background: 'var(--ink-900)',
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Multi-Chart View</span>

        <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
          {([['2x2', LayoutGrid, '4 charts'], ['3x2', Grid3x3, '6 charts']] as const).map(([val, Icon, label]) => (
            <button key={val} onClick={() => setMultiChartLayout(val)} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600,
              background: multiChartLayout === val ? 'rgba(0,212,255,0.1)' : 'transparent',
              border: multiChartLayout === val ? '1px solid rgba(0,212,255,0.25)' : '1px solid var(--hairline)',
              color: multiChartLayout === val ? 'var(--accent-blue)' : 'var(--mute)',
              transition: 'all 0.15s',
            }}>
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart grid */}
      <div style={{
        flex: 1, overflow: 'hidden',
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        gap: 6, padding: 6,
      }}>
        {displayed.map((sym, i) => (
          <MiniChart key={`${sym}-${i}`} symbol={sym} index={i} onChangeSymbol={(s) => changeSymbol(i, s)} />
        ))}
      </div>
    </div>
  )
}
