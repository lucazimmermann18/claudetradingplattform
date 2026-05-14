import dynamic from 'next/dynamic'

const PortfolioPanel = dynamic(() => import('@/components/portfolio/PortfolioPanel'), { ssr: false })

export default function PortfolioPage() {
  return (
    <div style={{ height: '100%' }}>
      <PortfolioPanel />
    </div>
  )
}
