import { useEffect, useMemo, useRef } from 'react'
import { useGatewayTelemetry, type ConnectionStatus } from './useGatewayTelemetry'
import { useCatalog } from './useCatalog'
import { ZONE_INFO, type Zone } from '../types/zone.types'
import type { Asset, Beacon, Employee } from '../types'
import type { ZoneMovementLog, ZoneReading } from '../services/gatewayService'
import type { CreateAssetInput, CreateEmployeeInput } from '../services/api'

export interface TrackedAsset extends Asset {
  zone: Zone | null
  rssi: number | null
  beacon: Beacon | null
  isOutOfRange: boolean
}

export interface TrackedEmployee extends Employee {
  zone: Zone | null
  rssi: number | null
  beacon: Beacon | null
  zoneEnteredAt: string | null
  isUnauthorizedInRestrictedZone: boolean
}

export interface UseTrackedEntitiesResult {
  assets: TrackedAsset[]
  employees: TrackedEmployee[]
  beacons: Beacon[]
  zoneByMac: Map<string, ZoneReading>
  movementLog: ZoneMovementLog[]
  isRunning: boolean
  connectionStatus: ConnectionStatus
  isLoadingCatalog: boolean
  catalogError: string | null
  linkBeacon: (assetId: string, mac: string) => Promise<void>
  createAsset: (input: CreateAssetInput) => Promise<void>
  createEmployee: (input: CreateEmployeeInput) => Promise<void>
}

/** Junta a telemetria ao vivo dos Gateways com o catálogo de Ativos/Funcionários/Beacons persistido no backend. */
export function useTrackedEntities(): UseTrackedEntitiesResult {
  const { zoneMap, movementLog, isRunning, connectionStatus } = useGatewayTelemetry()
  const {
    assets: catalogAssets,
    employees: catalogEmployees,
    beacons,
    isLoading: isLoadingCatalog,
    error: catalogError,
    linkBeacon,
    createAsset,
    createEmployee,
  } = useCatalog()
  const zoneEnteredAtRef = useRef<Map<string, string>>(new Map())

  useEffect(() => {
    const enteredAt = zoneEnteredAtRef.current
    for (const event of movementLog) {
      if (event.type !== 'entrada') continue
      const existing = enteredAt.get(event.mac)
      if (!existing || event.timestamp > existing) {
        enteredAt.set(event.mac, event.timestamp)
      }
    }
  }, [movementLog])

  const zoneByMac = useMemo(() => new Map(zoneMap.map((reading) => [reading.mac, reading])), [zoneMap])

  const assets = useMemo<TrackedAsset[]>(() => {
    return catalogAssets.map((asset) => {
      const reading = asset.beaconId ? zoneByMac.get(asset.beaconId) : undefined
      const beacon = asset.beaconId ? (beacons.find((b) => b.mac === asset.beaconId) ?? null) : null
      return {
        ...asset,
        zone: reading?.zone ?? null,
        rssi: reading?.rssi ?? null,
        beacon,
        isOutOfRange: Boolean(asset.beaconId) && !reading,
      }
    })
  }, [catalogAssets, beacons, zoneByMac])

  const employees = useMemo<TrackedEmployee[]>(() => {
    return catalogEmployees.map((employee) => {
      const reading = employee.beaconId ? zoneByMac.get(employee.beaconId) : undefined
      const beacon = employee.beaconId ? (beacons.find((b) => b.mac === employee.beaconId) ?? null) : null
      const zone = reading?.zone ?? null
      const restricted = zone ? ZONE_INFO[zone].restricted : false
      const authorized = zone ? (employee.authorizedZones?.includes(zone) ?? false) : true

      return {
        ...employee,
        zone,
        rssi: reading?.rssi ?? null,
        beacon,
        zoneEnteredAt: employee.beaconId ? (zoneEnteredAtRef.current.get(employee.beaconId) ?? null) : null,
        isUnauthorizedInRestrictedZone: restricted && !authorized,
      }
    })
  }, [catalogEmployees, beacons, zoneByMac])

  return {
    assets,
    employees,
    beacons,
    zoneByMac,
    movementLog,
    isRunning,
    connectionStatus,
    isLoadingCatalog,
    catalogError,
    linkBeacon,
    createAsset,
    createEmployee,
  }
}
