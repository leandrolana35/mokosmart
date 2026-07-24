import { useState, type FormEvent } from 'react'
import { Radio, Trash2, Plus } from 'lucide-react'
import { useGateways } from '../hooks/useGateways'
import { ZONES } from '../types/zone.types'

export function GatewaysPage() {
  const { gateways, isLoading, error, createGateway, updateZone, removeGateway } = useGateways()

  const [mac, setMac] = useState('')
  const [name, setName] = useState('')
  const [zone, setZone] = useState<string>(ZONES[0])
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmedMac = mac.trim().toLowerCase()
    if (!trimmedMac || !name.trim()) return

    setIsSubmitting(true)
    setFormError(null)
    try {
      await createGateway({ mac: trimmedMac, name: name.trim(), zone })
      setMac('')
      setName('')
      setZone(ZONES[0])
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Falha ao cadastrar Gateway.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleRemove(gatewayMac: string) {
    await removeGateway(gatewayMac)
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-300">
        Não foi possível carregar os Gateways: {error}
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <form
        onSubmit={handleSubmit}
        className="rounded-lg border border-slate-800 bg-slate-900 p-4 flex flex-wrap items-end gap-3"
      >
        <div className="flex-1 min-w-40">
          <label htmlFor="gateway-mac" className="block text-xs font-medium text-slate-400 mb-1">
            MAC do Gateway
          </label>
          <input
            id="gateway-mac"
            value={mac}
            onChange={(event) => setMac(event.target.value)}
            placeholder="fce8c0428d80"
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none font-mono"
          />
        </div>
        <div className="flex-1 min-w-40">
          <label htmlFor="gateway-name" className="block text-xs font-medium text-slate-400 mb-1">
            Nome
          </label>
          <input
            id="gateway-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Gateway Almoxarifado"
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="gateway-zone" className="block text-xs font-medium text-slate-400 mb-1">
            Zona
          </label>
          <select
            id="gateway-zone"
            value={zone}
            onChange={(event) => setZone(event.target.value)}
            className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
          >
            {ZONES.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <Plus className="size-4" />
          {isSubmitting ? 'Cadastrando...' : 'Cadastrar'}
        </button>
        {formError && <p className="w-full text-xs text-red-400">{formError}</p>}
      </form>

      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-slate-400">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Nome</th>
              <th className="px-4 py-3 text-left font-medium">MAC</th>
              <th className="px-4 py-3 text-left font-medium">Zona</th>
              <th className="px-4 py-3 text-right font-medium">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-950">
            {gateways.map((gateway) => (
              <tr key={gateway.mac}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 text-white font-medium">
                    <Radio className="size-4 text-blue-400" />
                    {gateway.name}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-500 font-mono text-xs">{gateway.mac}</td>
                <td className="px-4 py-3">
                  <select
                    value={gateway.zone}
                    onChange={(event) => void updateZone(gateway.mac, event.target.value)}
                    className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-white focus:border-blue-500 focus:outline-none"
                  >
                    {ZONES.map((z) => (
                      <option key={z} value={z}>
                        {z}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => void handleRemove(gateway.mac)}
                    className="text-slate-500 hover:text-red-400 transition-colors"
                    aria-label="Remover Gateway"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </td>
              </tr>
            ))}
            {!isLoading && gateways.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                  Nenhum Gateway cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
