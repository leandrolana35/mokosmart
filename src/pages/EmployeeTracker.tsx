import { useMemo, useState } from 'react'
import { Clock, Plus } from 'lucide-react'
import { RestrictedZoneAlert } from '../components/RestrictedZoneAlert'
import { MovementHistory } from '../components/MovementHistory'
import { CreateEmployeeModal } from '../components/CreateEmployeeModal'
import { ZONES, ZONE_INFO } from '../types/zone.types'
import type { UseTrackedEntitiesResult } from '../hooks/useTrackedEntities'

interface EmployeeTrackerProps {
  data: UseTrackedEntitiesResult
}

function formatDwell(seconds: number | null): string {
  if (seconds === null) return '—'
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds}s`
}

export function EmployeeTracker({ data }: EmployeeTrackerProps) {
  const { employees, movementLog, isLoadingCatalog, catalogError, createEmployee } = data
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const selectedEmployee = employees.find((employee) => employee.id === selectedEmployeeId) ?? employees[0] ?? null

  const employeeEvents = useMemo(() => {
    if (!selectedEmployee?.beaconId) return []
    return movementLog.filter((event) => event.mac === selectedEmployee.beaconId).slice().reverse()
  }, [movementLog, selectedEmployee])

  if (catalogError) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-300">
        Não foi possível carregar o catálogo do backend: {catalogError}. Verifique se o servidor (
        <code className="font-mono">server/</code>) está rodando.
      </div>
    )
  }

  if (isLoadingCatalog && employees.length === 0) {
    return <p className="text-sm text-slate-500">Carregando funcionários...</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="size-4" />
          Novo Funcionário
        </button>
      </div>

      <RestrictedZoneAlert employees={employees} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {ZONES.map((zone) => {
          const zoneEmployees = employees.filter((employee) => employee.zone === zone)
          const restricted = ZONE_INFO[zone].restricted

          return (
            <div key={zone} className="rounded-lg border border-slate-800 bg-slate-900 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white">{zone}</h3>
                {restricted && <span className="text-xs font-medium text-red-400">Zona Restrita</span>}
              </div>

              {zoneEmployees.length === 0 ? (
                <p className="text-xs text-slate-600">Ninguém presente</p>
              ) : (
                <ul className="space-y-2">
                  {zoneEmployees.map((employee) => {
                    const dwellSeconds = employee.zoneEnteredAt
                      ? Math.max(0, Math.floor((Date.now() - new Date(employee.zoneEnteredAt).getTime()) / 1000))
                      : null
                    return (
                      <li key={employee.id} className="flex items-center justify-between text-sm">
                        <span className={employee.isUnauthorizedInRestrictedZone ? 'text-red-300' : 'text-slate-200'}>
                          {employee.name}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Clock className="size-3" />
                          {formatDwell(dwellSeconds)}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )
        })}
      </div>

      <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Linha do tempo do funcionário</h3>
          <select
            value={selectedEmployee?.id ?? ''}
            onChange={(event) => setSelectedEmployeeId(event.target.value)}
            className="rounded-md border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none"
          >
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
              </option>
            ))}
          </select>
        </div>

        <MovementHistory events={employeeEvents} />
      </div>

      <CreateEmployeeModal open={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSubmit={createEmployee} />
    </div>
  )
}
