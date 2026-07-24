import { db } from '../db.js'

export interface GatewayRecord {
  mac: string
  name: string
  zone: string
}

export function listGateways(): GatewayRecord[] {
  return db.prepare('SELECT * FROM gateways ORDER BY name').all() as unknown as GatewayRecord[]
}

/** Mapa MAC → Zona usado pela resolução de zona em tempo real (telemetryStore). */
export function getGatewayZoneMap(): Record<string, string> {
  return Object.fromEntries(listGateways().map((gateway) => [gateway.mac, gateway.zone]))
}

export interface CreateGatewayInput {
  mac: string
  name: string
  zone: string
}

export function createGateway(input: CreateGatewayInput): GatewayRecord {
  const mac = input.mac.trim().toLowerCase()
  db.prepare('INSERT INTO gateways (mac, name, zone) VALUES (?, ?, ?)').run(mac, input.name, input.zone)
  return { mac, name: input.name, zone: input.zone }
}

export function updateGatewayZone(mac: string, zone: string): GatewayRecord | null {
  const normalizedMac = mac.trim().toLowerCase()
  db.prepare('UPDATE gateways SET zone = ? WHERE mac = ?').run(zone, normalizedMac)
  const row = db.prepare('SELECT * FROM gateways WHERE mac = ?').get(normalizedMac) as GatewayRecord | undefined
  return row ?? null
}

export function deleteGateway(mac: string): boolean {
  const result = db.prepare('DELETE FROM gateways WHERE mac = ?').run(mac.trim().toLowerCase())
  return result.changes > 0
}
