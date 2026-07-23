import { useState, type FormEvent } from 'react'
import { Radio } from 'lucide-react'

interface LoginPageProps {
  onLogin: (username: string, password: string) => Promise<void>
  error: string | null
}

export function LoginPage({ onLogin, error }: LoginPageProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      await onLogin(username, password)
    } catch {
      // erro já exposto via prop `error`
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Radio className="size-7 text-blue-400" />
          <span className="text-xl font-semibold text-white">MokoSmart</span>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-slate-800 bg-slate-900 p-6 space-y-4"
        >
          <div>
            <label htmlFor="username" className="block text-xs font-medium text-slate-400 mb-1">
              Usuário
            </label>
            <input
              id="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none"
              autoFocus
              autoComplete="username"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-medium text-slate-400 mb-1">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none"
              autoComplete="current-password"
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
