// Simulador de desenvolvimento: gera leituras falsas de beacons e envia via HTTP POST
// para /api/telemetry, no MESMO formato que um Gateway MOKO real usaria.
// Serve para testar o pipeline completo (HTTP -> servidor -> WebSocket -> frontend)
// antes de ter hardware real em campo. Rode com: npm run simulate (dentro de server/).

import { GATEWAY_CONFIG } from './config/gateways.js'

const SERVER_URL = process.env.TELEMETRY_URL ?? 'http://localhost:4000/api/telemetry'
const TICK_MS = 4000

interface MockBeacon {
  mac: string
  label: string
}

const MOCK_BEACONS: MockBeacon[] = [
  { mac: 'FF233DA11223', label: 'Furadeira Industrial #12' },
  { mac: 'FF233DA11224', label: 'Notebook Dell #08' },
  { mac: 'FF233DA11225', label: 'Empilhadeira Elétrica #03' },
  { mac: 'AA112233CC01', label: 'Crachá - João Silva' },
  { mac: 'AA112233CC02', label: 'Crachá - Maria Souza' },
]

const zones = GATEWAY_CONFIG.map((gateway) => gateway.zone)
const beaconTrueZone = new Map<string, string>(MOCK_BEACONS.map((beacon, index) => [beacon.mac, zones[index % zones.length]]))

function maybeMoveBeacon(mac: string): void {
  if (Math.random() > 0.15) return
  const current = beaconTrueZone.get(mac)
  const options = zones.filter((zone) => zone !== current)
  beaconTrueZone.set(mac, options[Math.floor(Math.random() * options.length)])
}

function simulateRssi(readingZone: string, trueZone: string): number | null {
  if (readingZone === trueZone) return Math.round(-(40 + Math.random() * 20))
  if (Math.random() < 0.25) return Math.round(-(80 + Math.random() * 15))
  return null
}

async function tick(): Promise<void> {
  for (const beacon of MOCK_BEACONS) {
    maybeMoveBeacon(beacon.mac)
  }

  for (const gateway of GATEWAY_CONFIG) {
    const devices = MOCK_BEACONS.map((beacon) => {
      const trueZone = beaconTrueZone.get(beacon.mac) as string
      const rssi = simulateRssi(gateway.zone, trueZone)
      return rssi !== null ? { mac: beacon.mac, rssi } : null
    }).filter((device): device is { mac: string; rssi: number } => device !== null)

    if (devices.length === 0) continue

    try {
      await fetch(SERVER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gatewaysmac: gateway.mac, devices }),
      })
    } catch (err) {
      console.error(`[simulate] falha ao enviar payload do gateway ${gateway.mac}:`, err)
    }
  }

  console.log(`[simulate] tick enviado às ${new Date().toLocaleTimeString('pt-BR')}`)
}

setInterval(tick, TICK_MS)
tick()
