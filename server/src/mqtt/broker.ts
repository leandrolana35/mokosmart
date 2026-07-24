import { createServer } from 'node:net'
import { Aedes } from 'aedes'
import type { AedesPublishPacket, Client } from 'aedes'
import { ingestPayload } from '../telemetryStore.js'
import type { GatewayPayload } from '../gatewayService.js'

const MQTT_PORT = process.env.MQTT_PORT ? Number(process.env.MQTT_PORT) : 1883

// Mensagem real do Gateway MKGW3 (ver MKGW3 MQTT Protocol V2.3, seção 3.5 "Report Bluetooth data").
// msg_id 3070 = leitura de Beacons; data é um array, um item por Beacon avistado nesse ciclo.
const BLUETOOTH_REPORT_MSG_ID = 3070

interface BeaconReportEntry {
  mac?: unknown
  rssi?: unknown
}

interface GatewayEnvelope {
  msg_id?: unknown
  device_info?: { mac?: unknown }
  data?: unknown
}

function isBeaconReport(entry: unknown): entry is { mac: string; rssi: number } {
  const candidate = entry as BeaconReportEntry
  return typeof candidate?.mac === 'string' && typeof candidate?.rssi === 'number'
}

/** Sobe um broker MQTT embutido — é nele que os Gateways MKGW3 reais devem se conectar (host = IP desta máquina, porta MQTT_PORT). */
export async function startMqttBroker(): Promise<Aedes> {
  // Aedes v1.x exige inicialização assíncrona: `new Aedes()` sozinho deixa a
  // persistência interna nunca configurada, e conexões ficam penduradas sem CONNACK.
  const aedes = await Aedes.createBroker()
  const server = createServer(aedes.handle)

  aedes.on('publish', (packet: AedesPublishPacket, client: Client | null) => {
    if (!client) return // republicação interna do broker (retained/will), não é do gateway
    if (packet.topic.startsWith('$SYS')) return

    let message: GatewayEnvelope
    try {
      message = JSON.parse(packet.payload.toString('utf8')) as GatewayEnvelope
    } catch {
      return
    }

    if (message.msg_id !== BLUETOOTH_REPORT_MSG_ID) return

    const gatewayMac = message.device_info?.mac
    if (typeof gatewayMac !== 'string' || !Array.isArray(message.data)) return

    const devices = message.data
      .filter(isBeaconReport)
      .map((entry) => ({ mac: entry.mac.toLowerCase(), rssi: entry.rssi }))

    if (devices.length === 0) return

    const payload: GatewayPayload = { gatewaysmac: gatewayMac.toLowerCase(), devices }
    ingestPayload(payload)
  })

  aedes.on('client', (client: Client) => {
    console.log(`[mqtt] Gateway conectado: ${client.id}`)
  })

  aedes.on('clientDisconnect', (client: Client) => {
    console.log(`[mqtt] Gateway desconectado: ${client.id}`)
  })

  server.listen(MQTT_PORT, () => {
    console.log(`Broker MQTT rodando em mqtt://0.0.0.0:${MQTT_PORT} (aponte o Gateway físico pra cá)`)
  })

  return aedes
}
