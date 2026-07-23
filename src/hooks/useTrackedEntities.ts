import { useEffect, useMemo, useRef } from 'react'
import { useGatewayTelemetry, type ConnectionStatus } from './useGatewayTelemetry'
import { MOCK_ASSETS, MOCK_EMPLOYEES, MOCK_BEACON_RECORDS } from '../services/mockData'
import { ZONE_INFO, type Zone } from '../types/zone.types'
import type { Asset, Beacon, Employee } from '../types'
import type { ZoneMovementLog, ZoneReading } from '../services/gatewayService'

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
}

/** Junta a telemetria ao vivo dos Gateways com os registros mock de Ativos/Funcionários/Beacons. */
export function useTrackedEntities(): UseTrackedEntitiesResult {
  const { zoneMap, movementLog, isRunning, connectionStatus } = useGatewayTelemetry()
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
    return MOCK_ASSETS.map((asset) => {
      const reading = asset.beaconId ? zoneByMac.get(asset.beaconId) : undefined
      const beacon = asset.beaconId ? (MOCK_BEACON_RECORDS.find((b) => b.mac === asset.beaconId) ?? null) : null
      return {
        ...asset,
        zone: reading?.zone ?? null,
        rssi: reading?.rssi ?? null,
        beacon,
        isOutOfRange: Boolean(asset.beaconId) && !reading,
      }
    })
  }, [zoneByMac])

  const employees = useMemo<TrackedEmployee[]>(() => {
    return MOCK_EMPLOYEES.map((employee) => {
      const reading = employee.beaconId ? zoneByMac.get(employee.beaconId) : undefined
      const beacon = employee.beaconId
        ? (MOCK_BEACON_RECORDS.find((b) => b.mac === employee.beaconId) ?? null)
        : null
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
  }, [zoneByMac])

  return { assets, employees, beacons: MOCK_BEACON_RECORDS, zoneByMac, movementLog, isRunning, connectionStatus }
}
