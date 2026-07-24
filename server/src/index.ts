import './loadEnv.js'
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
import { isAuthConfigured, verifyCredentials, issueToken, requireAuth, requireGatewayToken, verifyToken } from './auth.js'
import { startMqttBroker } from './mqtt/broker.js'

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:5173'
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
app.use(cors({ origin: CORS_ORIGIN }))
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body ?? {}
  if (typeof username !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'Campos obrigatórios: username, password.' })
    return
  }

  if (!isAuthConfigured()) {
    res.status(503).json({ error: 'Autenticação não configurada no servidor.' })
    return
  }

  const valid = await verifyCredentials(username, password)
  if (!valid) {
    res.status(401).json({ error: 'Usuário ou senha inválidos.' })
    return
  }

  res.json({ token: issueToken(username), username })
})

// Público de propósito: o frontend precisa saber se deve exigir login ANTES de ter um token.
app.get('/api/auth/status', (_req, res) => {
  res.json({ authConfigured: isAuthConfigured() })
})

app.get('/api/auth/me', requireAuth, (_req, res) => {
  res.json({ authConfigured: isAuthConfigured() })
})

// Endpoint que os Gateways MOKO devem chamar via HTTP POST:
// { "gatewaysmac": "AC233FA00001", "devices": [{ "mac": "FF233DA11223", "rssi": -65 }] }
app.post('/api/telemetry', requireGatewayToken, (req, res) => {
  const body = req.body as Partial<GatewayPayload>

  if (typeof body.gatewaysmac !== 'string' || !isValidDevices(body.devices)) {
    res.status(400).json({ error: 'Payload inválido. Esperado { gatewaysmac, devices: [{ mac, rssi }] }.' })
    return
  }

  ingestPayload({
    gatewaysmac: body.gatewaysmac.toLowerCase(),
    devices: body.devices.map((device) => ({ mac: device.mac.toLowerCase(), rssi: device.rssi })),
  })
  res.status(204).end()
})

app.get('/api/assets', requireAuth, (_req, res) => {
  res.json(listAssets())
})

app.post('/api/assets', requireAuth, (req, res) => {
  const { name, category, serialNumber, beaconId, status } = req.body ?? {}
  if (typeof name !== 'string' || typeof category !== 'string' || typeof serialNumber !== 'string') {
    res.status(400).json({ error: 'Campos obrigatórios: name, category, serialNumber.' })
    return
  }
  res.status(201).json(createAsset({ name, category, serialNumber, beaconId, status }))
})

app.patch('/api/assets/:id/beacon', requireAuth, (req, res) => {
  const { beaconId } = req.body ?? {}
  if (typeof beaconId !== 'string' || beaconId.trim().length === 0) {
    res.status(400).json({ error: 'Campo obrigatório: beaconId.' })
    return
  }

  const updated = updateAssetBeacon(req.params.id, beaconId.trim().toLowerCase())
  if (!updated) {
    res.status(404).json({ error: 'Ativo não encontrado.' })
    return
  }
  res.json(updated)
})

app.get('/api/employees', requireAuth, (_req, res) => {
  res.json(listEmployees())
})

app.post('/api/employees', requireAuth, (req, res) => {
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

app.get('/api/beacons', requireAuth, (_req, res) => {
  res.json(listBeacons())
})

app.get('/api/movements', requireAuth, (req, res) => {
  const mac = typeof req.query.mac === 'string' ? req.query.mac : undefined
  const limit = req.query.limit ? Number(req.query.limit) : undefined
  res.json(listMovements({ mac, limit }))
})

const httpServer = createServer(app)
const wss = new WebSocketServer({
  server: httpServer,
  path: '/ws',
  verifyClient: (info, callback) => {
    if (!isAuthConfigured()) {
      callback(true)
      return
    }

    const token = new URL(info.req.url ?? '', 'http://localhost').searchParams.get('token')
    if (token && verifyToken(token)) {
      callback(true)
      return
    }
    callback(false, 401, 'Não autenticado.')
  },
})

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
  console.log(`Endpoint de ingestão (demo/HTTP): POST http://localhost:${PORT}/api/telemetry`)
  console.log(`WebSocket disponível em ws://localhost:${PORT}/ws`)
  if (!isAuthConfigured()) {
    console.warn('[auth] JWT_SECRET/ADMIN_USERNAME/ADMIN_PASSWORD_HASH não configurados — API rodando SEM login (modo dev).')
  }
})

startMqttBroker().catch((err: unknown) => {
  console.error('[mqtt] falha ao iniciar o broker:', err)
})
