import { useEffect, useState } from 'react'
import type { ZoneMovementLog, ZoneReading } from '../services/gatewayService'

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected'

interface UseGatewayTelemetryOptions {
  url?: string
}

interface UseGatewayTelemetryResult {
  zoneMap: ZoneReading[]
  movementLog: ZoneMovementLog[]
  connectionStatus: ConnectionStatus
  isRunning: boolean
}

const DEFAULT_WS_URL = (import.meta.env.VITE_GATEWAY_WS_URL as string | undefined) ?? 'ws://localhost:4000/ws'
const RECONNECT_DELAY_MS = 3000

interface TelemetryMessage {
  type: string
  zones?: ZoneReading[]
  movements?: ZoneMovementLog[]
}

/** Assina o WebSocket do backend (server/) e expõe o mapa de zonas + histórico de movimentação ao vivo. */
export function useGatewayTelemetry(options: UseGatewayTelemetryOptions = {}): UseGatewayTelemetryResult {
  const { url = DEFAULT_WS_URL } = options

  const [zoneMap, setZoneMap] = useState<ZoneReading[]>([])
  const [movementLog, setMovementLog] = useState<ZoneMovementLog[]>([])
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting')

  useEffect(() => {
    let socket: WebSocket | null = null
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null
    let cancelled = false

    function connect() {
      setConnectionStatus('connecting')
      socket = new WebSocket(url)

      socket.onopen = () => {
        if (!cancelled) setConnectionStatus('connected')
      }

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string) as TelemetryMessage
          if (data.type !== 'telemetry') return

          setZoneMap(data.zones ?? [])
          if (data.movements && data.movements.length > 0) {
            const movements = data.movements
            setMovementLog((prev) => [...movements, ...prev].slice(0, 200))
          }
        } catch {
          // ignora mensagens malformadas
        }
      }

      socket.onclose = () => {
        if (cancelled) return
        setConnectionStatus('disconnected')
        reconnectTimeout = setTimeout(connect, RECONNECT_DELAY_MS)
      }

      socket.onerror = () => {
        socket?.close()
      }
    }

    connect()

    return () => {
      cancelled = true
      if (reconnectTimeout) clearTimeout(reconnectTimeout)
      socket?.close()
    }
  }, [url])

  return { zoneMap, movementLog, connectionStatus, isRunning: connectionStatus === 'connected' }
}
