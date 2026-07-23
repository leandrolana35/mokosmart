import { GATEWAY_ZONE_MAP } from './config/gateways.js'
import { resolveZones, buildMovementLog, type GatewayPayload, type ZoneReading, type ZoneMovementLog } from './gatewayService.js'
import { insertMovements, getLatestZonePerMac } from './repositories/movementsRepo.js'

// Se um Gateway não reportar nada nesse intervalo, seus dados somem do cálculo de zona
// (evita manter um dispositivo "grudado" numa zona antiga por tempo indefinido).
const STALE_AFTER_MS = 15_000

interface StoredPayload {
  payload: GatewayPayload
  receivedAt: number
}

const latestPayloadByGateway = new Map<string, StoredPayload>()

// Reconstrói o último estado conhecido a partir do histórico persistido, pra não gerar
// eventos de "entrada" falsos pra dispositivos que já estavam presentes antes do restart.
let previousZones = getLatestZonePerMac()

export function ingestPayload(payload: GatewayPayload): void {
  latestPayloadByGateway.set(payload.gatewaysmac, { payload, receivedAt: Date.now() })
}

export interface TelemetryTick {
  zones: ZoneReading[]
  movements: ZoneMovementLog[]
}

export function computeTick(): TelemetryTick {
  const now = Date.now()
  const freshPayloads = Array.from(latestPayloadByGateway.values())
    .filter((entry) => now - entry.receivedAt <= STALE_AFTER_MS)
    .map((entry) => entry.payload)

  const zonesMap = resolveZones(freshPayloads, GATEWAY_ZONE_MAP)
  const movements = buildMovementLog(zonesMap, previousZones)

  previousZones = new Map(Array.from(zonesMap.values()).map((reading) => [reading.mac, reading.zone]))

  if (movements.length > 0) {
    insertMovements(movements)
  }

  return { zones: Array.from(zonesMap.values()), movements }
}
