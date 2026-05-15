import Providers from '@/components/layout/Providers'
import AppShell from '@/components/layout/AppShell'

export default function Layout({ children }: { children: React.ReactNode }) {
  return <Providers><AppShell>{children}</AppShell></Providers>
}
