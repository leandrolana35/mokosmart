import express from 'express'
import cors from 'cors'
import { createServer } from 'node:http'
import { WebSocketServer, WebSocket } from 'ws'
import { ingestPayload, computeTick } from './telemetryStore.js'
import type { GatewayPayload, GatewayDeviceReading } from './gatewayService.js'

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000
const TICK_INTERVAL_MS = 3000

function isValidDevices(devices: unknown): devices is GatewayDeviceReading[] {
  return (
    Array.isArray(devices) &&
    devices.every(
      (device) =>
        typeof device === 'object' &&
        device !== null &&
        typeof (device as GatewayDeviceReading).mac === 'string' &&
        typeof (device as GatewayDeviceReading).rssi === 'number',
    )
  )
}

const app = express()
app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// Endpoint que os Gateways MOKO devem chamar via HTTP POST:
// { "gatewaysmac": "AC233FA00001", "devices": [{ "mac": "FF233DA11223", "rssi": -65 }] }
app.post('/api/telemetry', (req, res) => {
  const body = req.body as Partial<GatewayPayload>

  if (typeof body.gatewaysmac !== 'string' || !isValidDevices(body.devices)) {
    res.status(400).json({ error: 'Payload inválido. Esperado { gatewaysmac, devices: [{ mac, rssi }] }.' })
    return
  }

  ingestPayload({ gatewaysmac: body.gatewaysmac, devices: body.devices })
  res.status(204).end()
})

const httpServer = createServer(app)
const wss = new WebSocketServer({ server: httpServer, path: '/ws' })

function broadcast(data: unknown): void {
  const message = JSON.stringify(data)
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message)
    }
  }
}

setInterval(() => {
  const tick = computeTick()
  broadcast({ type: 'telemetry', ...tick })
}, TICK_INTERVAL_MS)

httpServer.listen(PORT, () => {
  console.log(`MokoSmart backend rodando em http://localhost:${PORT}`)
  console.log(`Endpoint de ingestão: POST http://localhost:${PORT}/api/telemetry`)
  console.log(`WebSocket disponível em ws://localhost:${PORT}/ws`)
})
