import type { Asset, AssetStatus, Beacon, Employee } from '../types'
import type { ZoneMovementLog } from './gatewayService'
import { getToken, clearToken } from './auth'

export interface GatewayDto {
  mac: string
  name: string
  zone: string
}

// O backend não guarda `currentLocation`/`lastSeenAt` — esses campos são derivados ao vivo
// da telemetria em useTrackedEntities. Os DTOs refletem exatamente o que a API retorna.
export type AssetDto = Omit<Asset, 'currentLocation'>
export type EmployeeDto = Omit<Employee, 'currentLocation'>
export type BeaconDto = Omit<Beacon, 'lastSeenAt'>

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:4000'

/** Dispara quando a API rejeita o token — useAuth escuta isso pra voltar à tela de login. */
export const UNAUTHORIZED_EVENT = 'mokosmart:unauthorized'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken()

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })

  if (res.status === 401) {
    clearToken()
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
  }

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

export interface CreateAssetInput {
  name: string
  category: string
  serialNumber: string
  status?: AssetStatus
}

export function createAsset(input: CreateAssetInput): Promise<AssetDto> {
  return request<AssetDto>('/api/assets', { method: 'POST', body: JSON.stringify(input) })
}

export interface CreateEmployeeInput {
  name: string
  registrationNumber: string
  department: string
  role: string
  authorizedZones?: string[]
}

export function createEmployee(input: CreateEmployeeInput): Promise<EmployeeDto> {
  return request<EmployeeDto>('/api/employees', { method: 'POST', body: JSON.stringify(input) })
}

export function fetchGateways(): Promise<GatewayDto[]> {
  return request<GatewayDto[]>('/api/gateways')
}

export interface CreateGatewayInput {
  mac: string
  name: string
  zone: string
}

export function createGateway(input: CreateGatewayInput): Promise<GatewayDto> {
  return request<GatewayDto>('/api/gateways', { method: 'POST', body: JSON.stringify(input) })
}

export function updateGatewayZone(mac: string, zone: string): Promise<GatewayDto> {
  return request<GatewayDto>(`/api/gateways/${mac}/zone`, { method: 'PATCH', body: JSON.stringify({ zone }) })
}

export function deleteGateway(mac: string): Promise<void> {
  return request<void>(`/api/gateways/${mac}`, { method: 'DELETE' })
}
