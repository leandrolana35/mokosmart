export type GatewayStatus = 'online' | 'offline'

export interface Gateway {
  id: string
  mac: string
  name: string
  serialNumber: string
  ipAddress: string
  firmwareVersion: string
  status: GatewayStatus
  location: string
  lastHeartbeatAt: string | null
}
