import './Skeleton.css'

interface SkeletonProps {
  width?: string | number
  height?: string | number
  borderRadius?: string | number
  style?: React.CSSProperties
}

export function Skeleton({ width = '100%', height = 14, borderRadius = 5, style }: SkeletonProps) {
  return (
    <span className="skeleton" style={{ display: 'block', width, height, borderRadius, flexShrink: 0, ...style }} />
  )
}

/* Pre-built skeleton shapes for common patterns */

export function SkeletonText({ lines = 1, style }: { lines?: number; style?: React.CSSProperties }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} width={i === lines - 1 && lines > 1 ? '65%' : '100%'} height={12} />
      ))}
    </div>
  )
}

export function SkeletonCard({ height = 80 }: { height?: number }) {
  return (
    <div style={{
      background: 'var(--ink-800)', border: '1px solid var(--hairline)',
      borderRadius: 9, padding: '12px 14px', height,
      display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'space-between',
    }}>
      <Skeleton width="45%" height={10} />
      <Skeleton width="60%" height={20} />
      <Skeleton width="35%" height={10} />
    </div>
  )
}

export function SkeletonRow({ cols = 4 }: { cols?: number }) {
  const widths = ['30%', '20%', '20%', '15%', '15%']
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px' }}>
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} width={widths[i] ?? '15%'} height={12} />
      ))}
    </div>
  )
}

export function SkeletonSignalCard() {
  return (
    <div style={{
      background: 'var(--ink-850)', border: '1px solid var(--hairline)',
      borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Skeleton width={38} height={38} borderRadius={9} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Skeleton width={80} height={14} />
            <Skeleton width={60} height={10} />
          </div>
        </div>
        <Skeleton width={50} height={26} borderRadius={6} />
      </div>
      <Skeleton width="100%" height={3} borderRadius={2} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
        {[0,1,2].map(i => <Skeleton key={i} height={52} borderRadius={8} />)}
      </div>
      <Skeleton width="100%" height={32} borderRadius={6} />
    </div>
  )
}
