import type { Zone } from './zone.types'

export type EmployeeStatus = 'active' | 'inactive'

export interface Employee {
  id: string
  name: string
  registrationNumber: string
  department: string
  role: string
  beaconId: string | null
  status: EmployeeStatus
  currentLocation: string | null
  authorizedZones?: Zone[]
}
