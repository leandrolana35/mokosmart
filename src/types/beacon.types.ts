export type BeaconType = 'asset' | 'employee'

export type BeaconStatus = 'online' | 'offline' | 'low_battery'

export interface Beacon {
  id: string
  mac: string
  name: string
  type: BeaconType
  uuid: string
  major: number
  minor: number
  batteryLevel: number
  txPower: number
  status: BeaconStatus
  lastSeenAt: string | null
  linkedAssetId: string | null
  linkedEmployeeId: string | null
}
