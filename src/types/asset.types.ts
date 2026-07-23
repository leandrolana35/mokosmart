export type AssetStatus = 'active' | 'inactive' | 'maintenance' | 'lost'

export interface Asset {
  id: string
  name: string
  category: string
  serialNumber: string
  beaconId: string | null
  status: AssetStatus
  currentLocation: string | null
  assignedToEmployeeId?: string
  createdAt: string
  updatedAt: string
}
