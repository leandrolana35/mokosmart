import { useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import type { CreateAssetInput } from '../services/api'
import type { AssetStatus } from '../types'

interface CreateAssetModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (input: CreateAssetInput) => Promise<void>
}

const STATUS_OPTIONS: { value: AssetStatus; label: string }[] = [
  { value: 'active', label: 'Em uso' },
  { value: 'maintenance', label: 'Manutenção' },
  { value: 'lost', label: 'Perdido' },
  { value: 'inactive', label: 'Inativo' },
]

export function CreateAssetModal({ open, onClose, onSubmit }: CreateAssetModalProps) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [serialNumber, setSerialNumber] = useState('')
  const [status, setStatus] = useState<AssetStatus>('active')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim() || !category.trim() || !serialNumber.trim()) return

    setIsSubmitting(true)
    setError(null)
    try {
      await onSubmit({ name: name.trim(), category: category.trim(), serialNumber: serialNumber.trim(), status })
      setName('')
      setCategory('')
      setSerialNumber('')
      setStatus('active')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao cadastrar ativo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-lg border border-slate-800 bg-slate-900 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-white">Novo Ativo</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
            aria-label="Fechar"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="asset-name" className="block text-xs font-medium text-slate-400 mb-1">
              Nome
            </label>
            <input
              id="asset-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Furadeira Industrial #13"
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none"
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="asset-category" className="block text-xs font-medium text-slate-400 mb-1">
              Categoria
            </label>
            <input
              id="asset-category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              placeholder="Ferramenta"
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="asset-serial" className="block text-xs font-medium text-slate-400 mb-1">
              Patrimônio
            </label>
            <input
              id="asset-serial"
              value={serialNumber}
              onChange={(event) => setSerialNumber(event.target.value)}
              placeholder="PAT-0013"
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="asset-status" className="block text-xs font-medium text-slate-400 mb-1">
              Status
            </label>
            <select
              id="asset-status"
              value={status}
              onChange={(event) => setStatus(event.target.value as AssetStatus)}
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
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
              {isSubmitting ? 'Cadastrando...' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
