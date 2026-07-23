export interface LocationEvent {
  id: string
  beaconId: string
  gatewayId: string
  rssi: number
  distance: number | null
  location: string
  timestamp: string
}
