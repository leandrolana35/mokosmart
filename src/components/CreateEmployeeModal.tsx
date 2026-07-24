import { useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import type { CreateEmployeeInput } from '../services/api'
import { ZONES, type Zone } from '../types/zone.types'

interface CreateEmployeeModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (input: CreateEmployeeInput) => Promise<void>
}

export function CreateEmployeeModal({ open, onClose, onSubmit }: CreateEmployeeModalProps) {
  const [name, setName] = useState('')
  const [registrationNumber, setRegistrationNumber] = useState('')
  const [department, setDepartment] = useState('')
  const [role, setRole] = useState('')
  const [authorizedZones, setAuthorizedZones] = useState<Zone[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  function toggleZone(zone: Zone) {
    setAuthorizedZones((prev) => (prev.includes(zone) ? prev.filter((z) => z !== zone) : [...prev, zone]))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim() || !registrationNumber.trim() || !department.trim() || !role.trim()) return

    setIsSubmitting(true)
    setError(null)
    try {
      await onSubmit({
        name: name.trim(),
        registrationNumber: registrationNumber.trim(),
        department: department.trim(),
        role: role.trim(),
        authorizedZones,
      })
      setName('')
      setRegistrationNumber('')
      setDepartment('')
      setRole('')
      setAuthorizedZones([])
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao cadastrar funcionário.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-lg border border-slate-800 bg-slate-900 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-white">Novo Funcionário</h3>
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
            <label htmlFor="employee-name" className="block text-xs font-medium text-slate-400 mb-1">
              Nome
            </label>
            <input
              id="employee-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ana Pereira"
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none"
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="employee-reg" className="block text-xs font-medium text-slate-400 mb-1">
              Matrícula
            </label>
            <input
              id="employee-reg"
              value={registrationNumber}
              onChange={(event) => setRegistrationNumber(event.target.value)}
              placeholder="F-0003"
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="employee-department" className="block text-xs font-medium text-slate-400 mb-1">
                Setor
              </label>
              <input
                id="employee-department"
                value={department}
                onChange={(event) => setDepartment(event.target.value)}
                placeholder="Manutenção"
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="employee-role" className="block text-xs font-medium text-slate-400 mb-1">
                Cargo
              </label>
              <input
                id="employee-role"
                value={role}
                onChange={(event) => setRole(event.target.value)}
                placeholder="Técnico"
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <span className="block text-xs font-medium text-slate-400 mb-1">Zonas autorizadas</span>
            <div className="flex flex-wrap gap-2">
              {ZONES.map((zone) => (
                <button
                  key={zone}
                  type="button"
                  onClick={() => toggleZone(zone)}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                    authorizedZones.includes(zone)
                      ? 'border-blue-500 bg-blue-500/15 text-blue-300'
                      : 'border-slate-700 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {zone}
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
              {isSubmitting ? 'Cadastrando...' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
