import type { Asset, Beacon, Employee } from '../types'
import { MOCK_BEACONS } from './gatewayService'

const NOW = new Date().toISOString()

export const MOCK_ASSETS: Asset[] = [
  {
    id: 'asset-1',
    name: 'Furadeira Industrial #12',
    category: 'Ferramenta',
    serialNumber: 'PAT-0012',
    beaconId: 'FF233DA11223',
    status: 'active',
    currentLocation: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'asset-2',
    name: 'Notebook Dell #08',
    category: 'Equipamento de TI',
    serialNumber: 'PAT-0008',
    beaconId: 'FF233DA11224',
    status: 'active',
    currentLocation: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'asset-3',
    name: 'Empilhadeira Elétrica #03',
    category: 'Máquina',
    serialNumber: 'PAT-0003',
    beaconId: 'FF233DA11225',
    status: 'maintenance',
    currentLocation: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'asset-4',
    name: 'Projetor Epson #21',
    category: 'Equipamento Audiovisual',
    serialNumber: 'PAT-0021',
    beaconId: null,
    status: 'active',
    currentLocation: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
]

export const MOCK_EMPLOYEES: Employee[] = [
  {
    id: 'emp-1',
    name: 'João Silva',
    registrationNumber: 'F-0001',
    department: 'Manutenção',
    role: 'Técnico Industrial',
    beaconId: 'AA112233CC01',
    status: 'active',
    currentLocation: null,
    authorizedZones: ['Almoxarifado', 'Oficina', 'Escritório'],
  },
  {
    id: 'emp-2',
    name: 'Maria Souza',
    registrationNumber: 'F-0002',
    department: 'Administrativo',
    role: 'Analista de Estoque',
    beaconId: 'AA112233CC02',
    status: 'active',
    currentLocation: null,
    authorizedZones: ['Escritório', 'Almoxarifado'],
  },
]

const BEACON_BATTERY_LEVELS: Record<string, number> = {
  FF233DA11223: 82,
  FF233DA11224: 45,
  FF233DA11225: 12,
  AA112233CC01: 67,
  AA112233CC02: 90,
}

export const MOCK_BEACON_RECORDS: Beacon[] = MOCK_BEACONS.map((beacon) => ({
  id: `beacon-${beacon.mac}`,
  mac: beacon.mac,
  name: beacon.label,
  type: beacon.kind,
  uuid: 'E2C56DB5-DFFB-48D2-B060-D0F5A71096E0',
  major: 1,
  minor: 1,
  batteryLevel: BEACON_BATTERY_LEVELS[beacon.mac] ?? 100,
  txPower: -59,
  status: 'online',
  lastSeenAt: null,
  linkedAssetId: MOCK_ASSETS.find((asset) => asset.beaconId === beacon.mac)?.id,
  linkedEmployeeId: MOCK_EMPLOYEES.find((employee) => employee.beaconId === beacon.mac)?.id,
}))
