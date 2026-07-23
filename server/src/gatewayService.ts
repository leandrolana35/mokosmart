// Lógica de resolução de zona espelhada de src/services/gatewayService.ts (frontend).
// Mantida standalone aqui (sem workspace compartilhado) por ser pequena, pura e estável;
// se crescer, vale extrair para um pacote compartilhado entre server/ e o frontend.

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
  zone: string
  rssi: number
}

export interface ZoneMovementLog {
  id: string
  mac: string
  zone: string
  type: 'entrada' | 'saida'
  timestamp: string
}

/** Para cada dispositivo, mantém a leitura do gateway com o maior RSSI (sinal mais forte) — essa é a zona atual. */
export function resolveZones(payloads: GatewayPayload[], gatewayZoneMap: Record<string, string>): Map<string, ZoneReading> {
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
  previousZones: Map<string, string>,
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
