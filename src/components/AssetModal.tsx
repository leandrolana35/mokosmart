import { useMemo, useState, type FormEvent } from 'react'
import { X, Radio } from 'lucide-react'
import type { TrackedAsset } from '../hooks/useTrackedEntities'
import type { ZoneReading } from '../services/gatewayService'

interface AssetModalProps {
  asset: TrackedAsset | null
  onClose: () => void
  onSubmit: (assetId: string, mac: string) => Promise<void>
  /** Dispositivos vistos pelos Gateways que ainda não estão vinculados a nenhum Beacon conhecido. */
  unrecognizedDevices: ZoneReading[]
}

export function AssetModal({ asset, onClose, onSubmit, unrecognizedDevices }: AssetModalProps) {
  const [mac, setMac] = useState('')
  const [filter, setFilter] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filteredDevices = useMemo(() => {
    const term = filter.trim().toLowerCase()
    const list = term ? unrecognizedDevices.filter((device) => device.mac.includes(term)) : unrecognizedDevices
    return list.slice().sort((a, b) => b.rssi - a.rssi)
  }, [unrecognizedDevices, filter])

  if (!asset) return null

  const assetId = asset.id

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = mac.trim().toLowerCase()
    if (!trimmed) return

    setIsSubmitting(true)
    setError(null)
    try {
      await onSubmit(assetId, trimmed)
      setMac('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao vincular beacon.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-lg border border-slate-800 bg-slate-900 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-white">Vincular Beacon</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
            aria-label="Fechar"
          >
            <X className="size-5" />
          </button>
        </div>

        <p className="text-sm text-slate-400 mb-4">
          Patrimônio: <span className="text-slate-200 font-medium">{asset.name}</span> ({asset.serialNumber})
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="beacon-mac" className="block text-xs font-medium text-slate-400 mb-1">
              MAC do Beacon
            </label>
            <input
              id="beacon-mac"
              value={mac}
              onChange={(event) => setMac(event.target.value)}
              placeholder="ff233da11223"
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none font-mono"
              autoFocus
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="device-filter" className="block text-xs font-medium text-slate-400">
                Dispositivos detectados sem vínculo
              </label>
              <span className="text-xs text-slate-600">{unrecognizedDevices.length} no total</span>
            </div>
            <input
              id="device-filter"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder="Buscar por MAC..."
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none font-mono mb-2"
            />

            <div className="max-h-40 overflow-y-auto rounded-md border border-slate-800 divide-y divide-slate-800">
              {filteredDevices.length === 0 && (
                <p className="p-3 text-xs text-slate-600">
                  {unrecognizedDevices.length === 0
                    ? 'Nenhum dispositivo não vinculado detectado ainda.'
                    : 'Nenhum resultado para essa busca.'}
                </p>
              )}
              {filteredDevices.map((device) => (
                <button
                  key={device.mac}
                  type="button"
                  onClick={() => setMac(device.mac)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs transition-colors hover:bg-slate-800 ${
                    mac === device.mac ? 'bg-blue-500/10' : ''
                  }`}
                >
                  <span className="flex items-center gap-2 font-mono text-slate-200">
                    <Radio className="size-3 text-slate-500" />
                    {device.mac}
                  </span>
                  <span className="text-slate-500">
                    {device.zone} · {device.rssi} dBm
                  </span>
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Vinculando...' : 'Vincular'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
