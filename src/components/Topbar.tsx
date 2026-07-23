import { Bell, UserCircle } from 'lucide-react'
import type { ConnectionStatus } from '../hooks/useGatewayTelemetry'

interface TopbarProps {
  title: string
  connectionStatus?: ConnectionStatus
}

const STATUS_CONFIG: Record<ConnectionStatus, { label: string; dot: string; text: string; bg: string }> = {
  connected: {
    label: 'Ao vivo',
    dot: 'bg-emerald-400 animate-pulse',
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
  },
  connecting: {
    label: 'Conectando...',
    dot: 'bg-amber-400 animate-pulse',
    text: 'text-amber-400',
    bg: 'bg-amber-500/15',
  },
  disconnected: {
    label: 'Backend offline',
    dot: 'bg-red-400',
    text: 'text-red-400',
    bg: 'bg-red-500/15',
  },
}

export function Topbar({ title, connectionStatus }: TopbarProps) {
  const status = connectionStatus ? STATUS_CONFIG[connectionStatus] : null

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-slate-900 border-b border-slate-800">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-white">{title}</h1>
        {status && (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${status.bg} ${status.text}`}
          >
            <span className={`size-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button type="button" className="text-slate-400 hover:text-white transition-colors" aria-label="Notificações">
          <Bell className="size-5" />
        </button>
        <div className="flex items-center gap-2 text-slate-300">
          <UserCircle className="size-6" />
          <span className="text-sm font-medium">Usuário</span>
        </div>
      </div>
    </header>
  )
}
