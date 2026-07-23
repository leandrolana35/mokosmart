import { db } from '../db.js'

export interface BeaconRecord {
  id: string
  mac: string
  name: string
  type: 'asset' | 'employee'
  uuid: string
  major: number
  minor: number
  batteryLevel: number
  txPower: number
  status: string
  linkedAssetId: string | null
  linkedEmployeeId: string | null
}

interface BeaconRow {
  id: string
  mac: string
  name: string
  type: string
  uuid: string
  major: number
  minor: number
  battery_level: number
  tx_power: number
  status: string
}

export function listBeacons(): BeaconRecord[] {
  const rows = db.prepare('SELECT * FROM beacons ORDER BY name').all() as unknown as BeaconRow[]
  const assetLinks = db.prepare('SELECT id, beacon_id FROM assets WHERE beacon_id IS NOT NULL').all() as unknown as {
    id: string
    beacon_id: string
  }[]
  const employeeLinks = db
    .prepare('SELECT id, beacon_id FROM employees WHERE beacon_id IS NOT NULL')
    .all() as unknown as { id: string; beacon_id: string }[]

  const assetByMac = new Map(assetLinks.map((row) => [row.beacon_id, row.id]))
  const employeeByMac = new Map(employeeLinks.map((row) => [row.beacon_id, row.id]))

  return rows.map((row) => ({
    id: row.id,
    mac: row.mac,
    name: row.name,
    type: row.type as BeaconRecord['type'],
    uuid: row.uuid,
    major: row.major,
    minor: row.minor,
    batteryLevel: row.battery_level,
    txPower: row.tx_power,
    status: row.status,
    linkedAssetId: assetByMac.get(row.mac) ?? null,
    linkedEmployeeId: employeeByMac.get(row.mac) ?? null,
  }))
}
