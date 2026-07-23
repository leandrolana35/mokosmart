import { db } from '../db.js'

export type AssetStatus = 'active' | 'inactive' | 'maintenance' | 'lost'

export interface AssetRecord {
  id: string
  name: string
  category: string
  serialNumber: string
  beaconId: string | null
  status: AssetStatus
  assignedToEmployeeId: string | null
  createdAt: string
  updatedAt: string
}

interface AssetRow {
  id: string
  name: string
  category: string
  serial_number: string
  beacon_id: string | null
  status: string
  assigned_to_employee_id: string | null
  created_at: string
  updated_at: string
}

function mapRow(row: AssetRow): AssetRecord {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    serialNumber: row.serial_number,
    beaconId: row.beacon_id,
    status: row.status as AssetStatus,
    assignedToEmployeeId: row.assigned_to_employee_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function listAssets(): AssetRecord[] {
  const rows = db.prepare('SELECT * FROM assets ORDER BY name').all() as unknown as AssetRow[]
  return rows.map(mapRow)
}

export function getAssetById(id: string): AssetRecord | null {
  const row = db.prepare('SELECT * FROM assets WHERE id = ?').get(id) as AssetRow | undefined
  return row ? mapRow(row) : null
}

export interface CreateAssetInput {
  name: string
  category: string
  serialNumber: string
  beaconId?: string | null
  status?: AssetStatus
}

export function createAsset(input: CreateAssetInput): AssetRecord {
  const id = `asset-${Date.now()}-${Math.round(Math.random() * 1000)}`
  const now = new Date().toISOString()

  db.prepare(
    `INSERT INTO assets (id, name, category, serial_number, beacon_id, status, assigned_to_employee_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?)`,
  ).run(id, input.name, input.category, input.serialNumber, input.beaconId ?? null, input.status ?? 'active', now, now)

  return getAssetById(id) as AssetRecord
}

export function updateAssetBeacon(id: string, beaconId: string | null): AssetRecord | null {
  const now = new Date().toISOString()
  db.prepare('UPDATE assets SET beacon_id = ?, updated_at = ? WHERE id = ?').run(beaconId, now, id)
  return getAssetById(id)
}
