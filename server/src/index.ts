import express from 'express'
import cors from 'cors'
import { createServer } from 'node:http'
import { WebSocketServer, WebSocket } from 'ws'
import './db.js'
import { ingestPayload, computeTick } from './telemetryStore.js'
import type { GatewayPayload, GatewayDeviceReading } from './gatewayService.js'
import { listAssets, createAsset, updateAssetBeacon } from './repositories/assetsRepo.js'
import { listEmployees, createEmployee } from './repositories/employeesRepo.js'
import { listBeacons } from './repositories/beaconsRepo.js'
import { listMovements } from './repositories/movementsRepo.js'

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

app.get('/api/assets', (_req, res) => {
  res.json(listAssets())
})

app.post('/api/assets', (req, res) => {
  const { name, category, serialNumber, beaconId, status } = req.body ?? {}
  if (typeof name !== 'string' || typeof category !== 'string' || typeof serialNumber !== 'string') {
    res.status(400).json({ error: 'Campos obrigatórios: name, category, serialNumber.' })
    return
  }
  res.status(201).json(createAsset({ name, category, serialNumber, beaconId, status }))
})

app.patch('/api/assets/:id/beacon', (req, res) => {
  const { beaconId } = req.body ?? {}
  if (typeof beaconId !== 'string' || beaconId.trim().length === 0) {
    res.status(400).json({ error: 'Campo obrigatório: beaconId.' })
    return
  }

  const updated = updateAssetBeacon(req.params.id, beaconId.trim().toUpperCase())
  if (!updated) {
    res.status(404).json({ error: 'Ativo não encontrado.' })
    return
  }
  res.json(updated)
})

app.get('/api/employees', (_req, res) => {
  res.json(listEmployees())
})

app.post('/api/employees', (req, res) => {
  const { name, registrationNumber, department, role, beaconId, authorizedZones } = req.body ?? {}
  if (
    typeof name !== 'string' ||
    typeof registrationNumber !== 'string' ||
    typeof department !== 'string' ||
    typeof role !== 'string'
  ) {
    res.status(400).json({ error: 'Campos obrigatórios: name, registrationNumber, department, role.' })
    return
  }
  res.status(201).json(createEmployee({ name, registrationNumber, department, role, beaconId, authorizedZones }))
})

app.get('/api/beacons', (_req, res) => {
  res.json(listBeacons())
})

app.get('/api/movements', (req, res) => {
  const mac = typeof req.query.mac === 'string' ? req.query.mac : undefined
  const limit = req.query.limit ? Number(req.query.limit) : undefined
  res.json(listMovements({ mac, limit }))
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
