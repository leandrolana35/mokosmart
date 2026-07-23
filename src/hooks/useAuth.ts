import { useCallback, useEffect, useState } from 'react'
import {
  login as loginRequest,
  logout as logoutRequest,
  verifySession,
  fetchAuthStatus,
  getToken,
} from '../services/auth'
import { UNAUTHORIZED_EVENT } from '../services/api'

interface UseAuthResult {
  isAuthenticated: boolean
  isChecking: boolean
  authRequired: boolean
  error: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

export function useAuth(): UseAuthResult {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [authRequired, setAuthRequired] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        const status = await fetchAuthStatus()
        if (cancelled) return
        setAuthRequired(status.authConfigured)

        if (!status.authConfigured) {
          setIsAuthenticated(true)
          setIsChecking(false)
          return
        }
      } catch {
        // não deu pra checar o status (backend fora do ar) — segue pro fluxo normal de login
      }

      if (cancelled) return

      const token = getToken()
      if (!token) {
        setIsChecking(false)
        return
      }

      const valid = await verifySession()
      if (!cancelled) {
        setIsAuthenticated(valid)
        setIsChecking(false)
      }
    }

    init()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    function handleUnauthorized() {
      setIsAuthenticated(false)
    }
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    setError(null)
    try {
      await loginRequest(username, password)
      setIsAuthenticated(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha no login.'
      setError(message)
      throw err
    }
  }, [])

  const logout = useCallback(() => {
    logoutRequest()
    setIsAuthenticated(false)
  }, [])

  return { isAuthenticated, isChecking, authRequired, error, login, logout }
}
