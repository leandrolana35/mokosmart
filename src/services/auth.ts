const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:4000'
const TOKEN_STORAGE_KEY = 'mokosmart.token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
}

export async function login(username: string, password: string): Promise<string> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error((body as { error?: string } | null)?.error ?? 'Falha no login.')
  }

  const { token } = (await res.json()) as { token: string }
  setToken(token)
  return token
}

export async function fetchAuthStatus(): Promise<{ authConfigured: boolean }> {
  const res = await fetch(`${API_URL}/api/auth/status`)
  if (!res.ok) throw new Error('Falha ao verificar status de autenticação.')
  return (await res.json()) as { authConfigured: boolean }
}

export async function verifySession(): Promise<boolean> {
  const token = getToken()
  if (!token) return false

  const res = await fetch(`${API_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.ok
}

export function logout(): void {
  clearToken()
}
