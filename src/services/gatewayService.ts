import type { Zone } from '../types/zone.types'

// Tipos compartilhados de telemetria — a lógica de resolução de zona/movimentação
// agora roda no backend (server/); aqui ficam só os tipos usados pra tipar as
// mensagens recebidas via WebSocket/REST.

export interface GatewayDeviceReading {
  mac: string
  rssi: number
}

export interface GatewayPayload {
  gatewaysmac: string
  devices: GatewayDeviceReading[]
}

export interface ZoneReading {
  mac: string
  zone: Zone
  rssi: number
}

export interface ZoneMovementLog {
  id: string
  mac: string
  zone: Zone
  type: 'entrada' | 'saida'
  timestamp: string
}
