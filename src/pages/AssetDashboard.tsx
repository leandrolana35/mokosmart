import { useMemo, useState } from 'react'
import { Battery, BatteryLow, Package, Wrench, WifiOff } from 'lucide-react'
import { KpiCard } from '../components/KpiCard'
import { Badge } from '../components/Badge'
import { AssetModal } from '../components/AssetModal'
import { ZONES } from '../types/zone.types'
import type { AssetStatus } from '../types'
import type { TrackedAsset, UseTrackedEntitiesResult } from '../hooks/useTrackedEntities'

interface AssetDashboardProps {
  data: UseTrackedEntitiesResult
}

const STATUS_LABELS: Record<AssetStatus, string> = {
  active: 'Em uso',
  inactive: 'Inativo',
  maintenance: 'Manutenção',
  lost: 'Perdido',
}

const STATUS_TONE: Record<AssetStatus, 'green' | 'amber' | 'red' | 'slate'> = {
  active: 'green',
  inactive: 'slate',
  maintenance: 'amber',
  lost: 'red',
}

const STATUS_OPTIONS: AssetStatus[] = ['active', 'maintenance', 'lost', 'inactive']

const LOW_BATTERY_THRESHOLD = 20

export function AssetDashboard({ data }: AssetDashboardProps) {
  const { assets, isLoadingCatalog, catalogError, linkBeacon } = data

  const [search, setSearch] = useState('')
  const [zoneFilter, setZoneFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [modalAsset, setModalAsset] = useState<TrackedAsset | null>(null)

  const filteredAssets = useMemo(() => {
    const term = search.trim().toLowerCase()
    return assets.filter((asset) => {
      const matchesSearch =
        term.length === 0 ||
        asset.name.toLowerCase().includes(term) ||
        asset.serialNumber.toLowerCase().includes(term)
      const matchesZone = zoneFilter === 'all' || asset.zone === zoneFilter
      const matchesStatus = statusFilter === 'all' || asset.status === statusFilter
      return matchesSearch && matchesZone && matchesStatus
    })
  }, [assets, search, zoneFilter, statusFilter])

  const totalAssets = assets.length
  const inUse = assets.filter((asset) => asset.status === 'active').length
  const outOfRange = assets.filter((asset) => asset.isOutOfRange).length
  const lowBattery = assets.filter((asset) => (asset.beacon?.batteryLevel ?? 100) < LOW_BATTERY_THRESHOLD).length

  async function handleLinkBeacon(assetId: string, mac: string) {
    await linkBeacon(assetId, mac)
    setModalAsset(null)
  }

  if (catalogError) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-300">
        Não foi possível carregar o catálogo do backend: {catalogError}. Verifique se o servidor (
        <code className="font-mono">server/</code>) está rodando.
      </div>
    )
  }

  if (isLoadingCatalog && assets.length === 0) {
    return <p className="text-sm text-slate-500">Carregando ativos...</p>
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total de Ativos" value={totalAssets} icon={Package} />
        <KpiCard label="Em Uso" value={inUse} icon={Wrench} tone="success" />
        <KpiCard label="Fora de Alcance" value={outOfRange} icon={WifiOff} tone="warning" />
        <KpiCard label="Bateria Baixa" value={lowBattery} icon={BatteryLow} tone="danger" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nome ou patrimônio..."
          className="flex-1 min-w-48 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none"
        />
        <select
          value={zoneFilter}
          onChange={(event) => setZoneFilter(event.target.value)}
          className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
        >
          <option value="all">Todas as zonas</option>
          {ZONES.map((zone) => (
            <option key={zone} value={zone}>
              {zone}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
        >
          <option value="all">Todos os status</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-slate-400">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Ativo</th>
              <th className="px-4 py-3 text-left font-medium">Zona Atual</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Bateria</th>
              <th className="px-4 py-3 text-left font-medium">Beacon</th>
              <th className="px-4 py-3 text-right font-medium">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-950">
            {filteredAssets.map((asset) => {
              const battery = asset.beacon?.batteryLevel
              return (
                <tr key={asset.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{asset.name}</p>
                    <p className="text-xs text-slate-500">{asset.serialNumber}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {asset.isOutOfRange ? <Badge tone="slate">Fora de alcance</Badge> : (asset.zone ?? '—')}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONE[asset.status]}>{STATUS_LABELS[asset.status]}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {battery !== undefined ? (
                      <div className="flex items-center gap-2">
                        <Battery
                          className={`size-4 ${battery < LOW_BATTERY_THRESHOLD ? 'text-red-400' : 'text-emerald-400'}`}
                        />
                        <span className="text-slate-300">{battery}%</span>
                      </div>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500 font-mono text-xs">{asset.beaconId ?? '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setModalAsset(asset)}
                      className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Vincular Beacon
                    </button>
                  </td>
                </tr>
              )
            })}
            {filteredAssets.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                  Nenhum ativo encontrado para os filtros atuais.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AssetModal asset={modalAsset} onClose={() => setModalAsset(null)} onSubmit={handleLinkBeacon} />
    </div>
  )
}
