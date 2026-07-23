import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import type { ZoneMovementLog } from '../services/gatewayService'

interface MovementHistoryProps {
  events: ZoneMovementLog[]
}

export function MovementHistory({ events }: MovementHistoryProps) {
  if (events.length === 0) {
    return <p className="text-sm text-slate-500">Nenhuma movimentação registrada ainda hoje.</p>
  }

  return (
    <ol className="relative border-s border-slate-800 ps-4 space-y-4">
      {events.map((event) => (
        <li key={event.id} className="flex items-start gap-2">
          {event.type === 'entrada' ? (
            <ArrowDownCircle className="size-4 mt-0.5 text-emerald-400 shrink-0" />
          ) : (
            <ArrowUpCircle className="size-4 mt-0.5 text-slate-500 shrink-0" />
          )}
          <div>
            <p className="text-sm text-slate-200">
              {event.type === 'entrada' ? 'Entrou em' : 'Saiu de'} <span className="font-medium">{event.zone}</span>
            </p>
            <p className="text-xs text-slate-500">{new Date(event.timestamp).toLocaleTimeString('pt-BR')}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}
