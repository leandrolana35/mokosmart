import { ZONES, type Zone } from '../types/zone.types'

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

interface MockGateway {
  mac: string
  zone: Zone
}

const MOCK_GATEWAYS: MockGateway[] = [
  { mac: 'AC233FA00001', zone: 'Almoxarifado' },
  { mac: 'AC233FA00002', zone: 'Oficina' },
  { mac: 'AC233FA00003', zone: 'Escritório' },
]

export const GATEWAY_ZONE_MAP: Record<string, Zone> = Object.fromEntries(
  MOCK_GATEWAYS.map((gateway) => [gateway.mac, gateway.zone]),
)

export interface MockBeacon {
  mac: string
  label: string
  kind: 'asset' | 'employee'
}

export const MOCK_BEACONS: MockBeacon[] = [
  { mac: 'FF233DA11223', label: 'Furadeira Industrial #12', kind: 'asset' },
  { mac: 'FF233DA11224', label: 'Notebook Dell #08', kind: 'asset' },
  { mac: 'FF233DA11225', label: 'Empilhadeira Elétrica #03', kind: 'asset' },
  { mac: 'AA112233CC01', label: 'Crachá - João Silva', kind: 'employee' },
  { mac: 'AA112233CC02', label: 'Crachá - Maria Souza', kind: 'employee' },
]

export function getBeaconLabel(mac: string): string {
  return MOCK_BEACONS.find((beacon) => beacon.mac === mac)?.label ?? mac
}

// Zona "real" simulada de cada beacon, usada só pelo gerador mock para produzir leituras plausíveis.
const beaconTrueZone = new Map<string, Zone>(
  MOCK_BEACONS.map((beacon, index) => [beacon.mac, ZONES[index % ZONES.length]]),
)

function maybeMoveBeacon(mac: string): void {
  if (Math.random() > 0.15) return
  const currentZone = beaconTrueZone.get(mac)
  const options = ZONES.filter((zone) => zone !== currentZone)
  beaconTrueZone.set(mac, options[Math.floor(Math.random() * options.length)])
}

// Sinal forte se o gateway está na zona real do beacon; chance de vazamento fraco para zonas vizinhas (paredes); senão não detectado.
function simulateRssi(readingZone: Zone, trueZone: Zone): number | null {
  if (readingZone === trueZone) {
    return Math.round(-(40 + Math.random() * 20))
  }
  if (Math.random() < 0.25) {
    return Math.round(-(80 + Math.random() * 15))
  }
  return null
}

/** Gera o payload que cada um dos 3 Gateways mock enviaria neste instante. */
export function generateMockGatewayPayloads(): GatewayPayload[] {
  for (const beacon of MOCK_BEACONS) {
    maybeMoveBeacon(beacon.mac)
  }

  return MOCK_GATEWAYS.map((gateway) => {
    const devices: GatewayDeviceReading[] = []
    for (const beacon of MOCK_BEACONS) {
      const trueZone = beaconTrueZone.get(beacon.mac) as Zone
      const rssi = simulateRssi(gateway.zone, trueZone)
      if (rssi !== null) {
        devices.push({ mac: beacon.mac, rssi })
      }
    }
    return { gatewaysmac: gateway.mac, devices }
  })
}

/** Para cada dispositivo, mantém a leitura do gateway com o maior RSSI (sinal mais forte) — essa é a zona atual. */
export function resolveZones(
  payloads: GatewayPayload[],
  gatewayZoneMap: Record<string, Zone> = GATEWAY_ZONE_MAP,
): Map<string, ZoneReading> {
  const best = new Map<string, ZoneReading>()

  for (const payload of payloads) {
    const zone = gatewayZoneMap[payload.gatewaysmac]
    if (!zone) continue

    for (const device of payload.devices) {
      const current = best.get(device.mac)
      if (!current || device.rssi > current.rssi) {
        best.set(device.mac, { mac: device.mac, zone, rssi: device.rssi })
      }
    }
  }

  return best
}

/** Compara a zona atual com a anterior por dispositivo e emite eventos de saída/entrada quando ela muda. */
export function buildMovementLog(
  currentZones: Map<string, ZoneReading>,
  previousZones: Map<string, Zone>,
): ZoneMovementLog[] {
  const events: ZoneMovementLog[] = []
  const timestamp = new Date().toISOString()

  for (const [mac, reading] of currentZones) {
    const previousZone = previousZones.get(mac)
    if (reading.zone === previousZone) continue

    if (previousZone) {
      events.push({ id: `${mac}-saida-${timestamp}`, mac, zone: previousZone, type: 'saida', timestamp })
    }
    events.push({ id: `${mac}-entrada-${timestamp}`, mac, zone: reading.zone, type: 'entrada', timestamp })
  }

  return events
}

export interface TelemetryTickResult {
  zones: Map<string, ZoneReading>
  movements: ZoneMovementLog[]
}

/** Orquestra um ciclo de telemetria: resolve zonas a partir dos payloads e gera o log de movimentação. */
export function processTelemetryTick(
  payloads: GatewayPayload[],
  previousZones: Map<string, Zone>,
  gatewayZoneMap: Record<string, Zone> = GATEWAY_ZONE_MAP,
): TelemetryTickResult {
  const zones = resolveZones(payloads, gatewayZoneMap)
  const movements = buildMovementLog(zones, previousZones)
  return { zones, movements }
}
