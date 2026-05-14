import dynamic from 'next/dynamic'

const TradingChart = dynamic(() => import('@/components/chart/TradingChart'), { ssr: false })

export default function ChartPage() {
  return (
    <div style={{ height: '100%' }}>
      <TradingChart />
    </div>
  )
}
