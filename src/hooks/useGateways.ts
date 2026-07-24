import { useCallback, useEffect, useState } from 'react'
import {
  fetchGateways,
  createGateway as apiCreateGateway,
  updateGatewayZone as apiUpdateGatewayZone,
  deleteGateway as apiDeleteGateway,
  type GatewayDto,
  type CreateGatewayInput,
} from '../services/api'

interface UseGatewaysResult {
  gateways: GatewayDto[]
  isLoading: boolean
  error: string | null
  createGateway: (input: CreateGatewayInput) => Promise<void>
  updateZone: (mac: string, zone: string) => Promise<void>
  removeGateway: (mac: string) => Promise<void>
}

/** CRUD do cadastro de Gateways (MAC → Zona) persistido no backend. */
export function useGateways(): UseGatewaysResult {
  const [gateways, setGateways] = useState<GatewayDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchGateways()
      .then((data) => {
        if (!cancelled) setGateways(data)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Falha ao carregar Gateways.')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const createGateway = useCallback(async (input: CreateGatewayInput) => {
    const created = await apiCreateGateway(input)
    setGateways((prev) => [...prev, created])
  }, [])

  const updateZone = useCallback(async (mac: string, zone: string) => {
    const updated = await apiUpdateGatewayZone(mac, zone)
    setGateways((prev) => prev.map((gateway) => (gateway.mac === mac ? updated : gateway)))
  }, [])

  const removeGateway = useCallback(async (mac: string) => {
    await apiDeleteGateway(mac)
    setGateways((prev) => prev.filter((gateway) => gateway.mac !== mac))
  }, [])

  return { gateways, isLoading, error, createGateway, updateZone, removeGateway }
}
