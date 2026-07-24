// Simulador MQTT: conecta como cliente no NOSSO broker embutido e publica leituras falsas
// de beacon no formato REAL do protocolo MKGW3 (msg_id 3070, ver MKGW3 MQTT Protocol V2.3).
// Serve pra testar o parser (server/src/mqtt/broker.ts) sem precisar do Gateway físico por perto.
// Rode com: npm run simulate:mqtt (dentro de server/), com o backend (npm run dev) já rodando.

import './loadEnv.js'
import mqtt from 'mqtt'
import { GATEWAY_CONFIG } from './config/gateways.js'

const MQTT_URL = process.env.MQTT_SIMULATOR_URL ?? `mqtt://localhost:${process.env.MQTT_PORT ?? 1883}`
const TICK_MS = 4000

interface MockBeacon {
  mac: string
  label: string
}

const MOCK_BEACONS: MockBeacon[] = [
  { mac: 'ff233da11223', label: 'Furadeira Industrial #12' },
  { mac: 'ff233da11224', label: 'Notebook Dell #08' },
  { mac: 'ff233da11225', label: 'Empilhadeira Elétrica #03' },
  { mac: 'aa112233cc01', label: 'Crachá - João Silva' },
  { mac: 'aa112233cc02', label: 'Crachá - Maria Souza' },
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

const client = mqtt.connect(MQTT_URL, { clientId: 'simulate-mqtt' })

function tick(): void {
  for (const beacon of MOCK_BEACONS) {
    maybeMoveBeacon(beacon.mac)
  }

  for (const gateway of GATEWAY_CONFIG) {
    const data = MOCK_BEACONS.map((beacon) => {
      const trueZone = beaconTrueZone.get(beacon.mac) as string
      const rssi = simulateRssi(gateway.zone, trueZone)
      if (rssi === null) return null
      return {
        timestamp: Date.now(),
        timezone: 0,
        type_code: 0,
        type: 'ibeacon',
        rssi,
        connectable: 0,
        mac: beacon.mac,
        raw_data: '',
        uuid: 'e2c56db5dffb48d2b060d0f5a71096e0',
        major: 1,
        minor: 1,
        rssi_1m: -56,
      }
    }).filter((entry): entry is NonNullable<typeof entry> => entry !== null)

    if (data.length === 0) continue

    const message = { msg_id: 3070, device_info: { mac: gateway.mac }, data }
    client.publish(`/MKGW3/${gateway.mac}/send`, JSON.stringify(message))
  }

  console.log(`[simulate-mqtt] tick enviado às ${new Date().toLocaleTimeString('pt-BR')}`)
}

client.on('connect', () => {
  console.log(`[simulate-mqtt] conectado em ${MQTT_URL}`)
  setInterval(tick, TICK_MS)
  tick()
})

client.on('error', (err) => {
  console.error('[simulate-mqtt] erro de conexão:', err.message)
})
