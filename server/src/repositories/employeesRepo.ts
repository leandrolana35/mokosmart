import { db } from '../db.js'

export type EmployeeStatus = 'active' | 'inactive'

export interface EmployeeRecord {
  id: string
  name: string
  registrationNumber: string
  department: string
  role: string
  beaconId: string | null
  status: EmployeeStatus
  authorizedZones: string[]
}

interface EmployeeRow {
  id: string
  name: string
  registration_number: string
  department: string
  role: string
  beacon_id: string | null
  status: string
  authorized_zones: string
}

function mapRow(row: EmployeeRow): EmployeeRecord {
  return {
    id: row.id,
    name: row.name,
    registrationNumber: row.registration_number,
    department: row.department,
    role: row.role,
    beaconId: row.beacon_id,
    status: row.status as EmployeeStatus,
    authorizedZones: JSON.parse(row.authorized_zones) as string[],
  }
}

export function listEmployees(): EmployeeRecord[] {
  const rows = db.prepare('SELECT * FROM employees ORDER BY name').all() as unknown as EmployeeRow[]
  return rows.map(mapRow)
}

export function getEmployeeById(id: string): EmployeeRecord | null {
  const row = db.prepare('SELECT * FROM employees WHERE id = ?').get(id) as EmployeeRow | undefined
  return row ? mapRow(row) : null
}

export interface CreateEmployeeInput {
  name: string
  registrationNumber: string
  department: string
  role: string
  beaconId?: string | null
  authorizedZones?: string[]
}

export function createEmployee(input: CreateEmployeeInput): EmployeeRecord {
  const id = `emp-${Date.now()}-${Math.round(Math.random() * 1000)}`

  db.prepare(
    `INSERT INTO employees (id, name, registration_number, department, role, beacon_id, status, authorized_zones)
     VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`,
  ).run(
    id,
    input.name,
    input.registrationNumber,
    input.department,
    input.role,
    input.beaconId ?? null,
    JSON.stringify(input.authorizedZones ?? []),
  )

  return getEmployeeById(id) as EmployeeRecord
}
