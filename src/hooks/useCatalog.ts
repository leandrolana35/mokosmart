import { useCallback, useEffect, useState } from 'react'
import { fetchAssets, fetchEmployees, fetchBeacons, linkAssetBeacon } from '../services/api'
import type { Asset, Beacon, Employee } from '../types'

interface UseCatalogResult {
  assets: Asset[]
  employees: Employee[]
  beacons: Beacon[]
  isLoading: boolean
  error: string | null
  linkBeacon: (assetId: string, mac: string) => Promise<void>
}

/** Busca o catálogo de Ativos/Funcionários/Beacons persistido no backend (server/). */
export function useCatalog(): UseCatalogResult {
  const [assets, setAssets] = useState<Asset[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [beacons, setBeacons] = useState<Beacon[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)

    Promise.all([fetchAssets(), fetchEmployees(), fetchBeacons()])
      .then(([assetDtos, employeeDtos, beaconDtos]) => {
        if (cancelled) return
        setAssets(assetDtos.map((asset) => ({ ...asset, currentLocation: null })))
        setEmployees(employeeDtos.map((employee) => ({ ...employee, currentLocation: null })))
        setBeacons(beaconDtos.map((beacon) => ({ ...beacon, lastSeenAt: null })))
        setError(null)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Falha ao carregar catálogo do backend.')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const linkBeacon = useCallback(async (assetId: string, mac: string) => {
    const updated = await linkAssetBeacon(assetId, mac)
    setAssets((prev) => prev.map((asset) => (asset.id === assetId ? { ...updated, currentLocation: null } : asset)))
  }, [])

  return { assets, employees, beacons, isLoading, error, linkBeacon }
}
