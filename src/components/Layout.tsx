import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import type { PageKey } from './navigation'
import type { ConnectionStatus } from '../hooks/useGatewayTelemetry'

interface LayoutProps {
  title: string
  activePage: PageKey
  onNavigate: (page: PageKey) => void
  connectionStatus?: ConnectionStatus
  onLogout?: () => void
  children: ReactNode
}

export function Layout({ title, activePage, onNavigate, connectionStatus, onLogout, children }: LayoutProps) {
  return (
    <div className="min-h-screen flex bg-slate-950">
      <Sidebar activePage={activePage} onNavigate={onNavigate} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title={title} connectionStatus={connectionStatus} onLogout={onLogout} />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
