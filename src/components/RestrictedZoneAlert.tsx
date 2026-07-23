import { ShieldAlert } from 'lucide-react'
import type { TrackedEmployee } from '../hooks/useTrackedEntities'

interface RestrictedZoneAlertProps {
  employees: TrackedEmployee[]
}

export function RestrictedZoneAlert({ employees }: RestrictedZoneAlertProps) {
  const flagged = employees.filter((employee) => employee.isUnauthorizedInRestrictedZone)

  if (flagged.length === 0) return null

  return (
    <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 space-y-2">
      {flagged.map((employee) => (
        <div key={employee.id} className="flex items-center gap-3">
          <ShieldAlert className="size-5 text-red-400 shrink-0" />
          <p className="text-sm text-red-300">
            <span className="font-semibold">{employee.name}</span> foi detectado(a) em{' '}
            <span className="font-semibold">{employee.zone}</span> sem autorização.
          </p>
        </div>
      ))}
    </div>
  )
}
