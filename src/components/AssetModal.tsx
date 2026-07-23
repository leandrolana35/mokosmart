import { useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import type { TrackedAsset } from '../hooks/useTrackedEntities'

interface AssetModalProps {
  asset: TrackedAsset | null
  onClose: () => void
  onSubmit: (assetId: string, mac: string) => void
}

export function AssetModal({ asset, onClose, onSubmit }: AssetModalProps) {
  const [mac, setMac] = useState('')

  if (!asset) return null

  const assetId = asset.id

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = mac.trim().toUpperCase()
    if (!trimmed) return
    onSubmit(assetId, trimmed)
    setMac('')
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
              placeholder="FF233DA11223"
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none"
              autoFocus
            />
          </div>

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
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Vincular
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
