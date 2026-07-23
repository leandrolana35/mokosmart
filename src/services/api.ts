import type { Asset, Beacon, Employee } from '../types'
import type { ZoneMovementLog } from './gatewayService'

// O backend não guarda `currentLocation`/`lastSeenAt` — esses campos são derivados ao vivo
// da telemetria em useTrackedEntities. Os DTOs refletem exatamente o que a API retorna.
export type AssetDto = Omit<Asset, 'currentLocation'>
export type EmployeeDto = Omit<Employee, 'currentLocation'>
export type BeaconDto = Omit<Beacon, 'lastSeenAt'>

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:4000'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error((body as { error?: string } | null)?.error ?? `Erro ${res.status} em ${path}`)
  }

  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export function fetchAssets(): Promise<AssetDto[]> {
  return request<AssetDto[]>('/api/assets')
}

export function fetchEmployees(): Promise<EmployeeDto[]> {
  return request<EmployeeDto[]>('/api/employees')
}

export function fetchBeacons(): Promise<BeaconDto[]> {
  return request<BeaconDto[]>('/api/beacons')
}

export function fetchMovements(options: { mac?: string; limit?: number } = {}): Promise<ZoneMovementLog[]> {
  const params = new URLSearchParams()
  if (options.mac) params.set('mac', options.mac)
  if (options.limit) params.set('limit', String(options.limit))
  const query = params.toString()
  return request<ZoneMovementLog[]>(`/api/movements${query ? `?${query}` : ''}`)
}

export function linkAssetBeacon(assetId: string, beaconId: string): Promise<AssetDto> {
  return request<AssetDto>(`/api/assets/${assetId}/beacon`, {
    method: 'PATCH',
    body: JSON.stringify({ beaconId }),
  })
}
