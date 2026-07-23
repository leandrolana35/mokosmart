import { Package, Users, WifiOff, ShieldAlert } from 'lucide-react'
import { KpiCard } from '../components/KpiCard'
import { Badge } from '../components/Badge'
import { ZONES, ZONE_INFO } from '../types/zone.types'
import type { UseTrackedEntitiesResult } from '../hooks/useTrackedEntities'

interface DashboardPageProps {
  data: UseTrackedEntitiesResult
}

export function DashboardPage({ data }: DashboardPageProps) {
  const { assets, employees, isLoadingCatalog, catalogError } = data

  if (catalogError) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-300">
        Não foi possível carregar o catálogo do backend: {catalogError}. Verifique se o servidor (
        <code className="font-mono">server/</code>) está rodando.
      </div>
    )
  }

  if (isLoadingCatalog && assets.length === 0 && employees.length === 0) {
    return <p className="text-sm text-slate-500">Carregando dashboard...</p>
  }

  const totalAssets = assets.length
  const assetsOutOfRange = assets.filter((asset) => asset.isOutOfRange).length
  const employeesPresent = employees.filter((employee) => employee.zone !== null).length
  const restrictedAlerts = employees.filter((employee) => employee.isUnauthorizedInRestrictedZone).length

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total de Ativos" value={totalAssets} icon={Package} />
        <KpiCard label="Funcionários Presentes" value={employeesPresent} icon={Users} tone="success" />
        <KpiCard label="Ativos Fora de Alcance" value={assetsOutOfRange} icon={WifiOff} tone="warning" />
        <KpiCard label="Alertas em Zona Restrita" value={restrictedAlerts} icon={ShieldAlert} tone="danger" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {ZONES.map((zone) => {
          const zoneAssets = assets.filter((asset) => asset.zone === zone)
          const zoneEmployees = employees.filter((employee) => employee.zone === zone)
          const restricted = ZONE_INFO[zone].restricted

          return (
            <div key={zone} className="rounded-lg border border-slate-800 bg-slate-900 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white">{zone}</h3>
                {restricted && <Badge tone="red">Restrita</Badge>}
              </div>

              <div className="flex items-center gap-4 mb-3 text-sm text-slate-400">
                <span>{zoneAssets.length} ativo(s)</span>
                <span>{zoneEmployees.length} pessoa(s)</span>
              </div>

              <ul className="space-y-1">
                {zoneAssets.map((asset) => (
                  <li key={asset.id} className="text-xs text-slate-300">
                    {asset.name}
                  </li>
                ))}
                {zoneEmployees.map((employee) => (
                  <li key={employee.id} className="text-xs text-blue-300">
                    {employee.name}
                  </li>
                ))}
                {zoneAssets.length === 0 && zoneEmployees.length === 0 && (
                  <li className="text-xs text-slate-600">Vazio no momento</li>
                )}
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}
