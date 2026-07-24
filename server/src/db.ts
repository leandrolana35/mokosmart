import { DatabaseSync } from 'node:sqlite'
import { existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '..', 'data')
const DB_PATH = process.env.DB_PATH ?? join(DATA_DIR, 'mokosmart.db')

if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true })
}

export const db = new DatabaseSync(DB_PATH)

db.exec(`
  CREATE TABLE IF NOT EXISTS beacons (
    id TEXT PRIMARY KEY,
    mac TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    uuid TEXT NOT NULL,
    major INTEGER NOT NULL,
    minor INTEGER NOT NULL,
    battery_level INTEGER NOT NULL,
    tx_power INTEGER NOT NULL,
    status TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS assets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    serial_number TEXT NOT NULL,
    beacon_id TEXT,
    status TEXT NOT NULL,
    assigned_to_employee_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    registration_number TEXT NOT NULL,
    department TEXT NOT NULL,
    role TEXT NOT NULL,
    beacon_id TEXT,
    status TEXT NOT NULL,
    authorized_zones TEXT NOT NULL DEFAULT '[]'
  );

  CREATE TABLE IF NOT EXISTS gateways (
    mac TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    zone TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS movements (
    id TEXT PRIMARY KEY,
    mac TEXT NOT NULL,
    zone TEXT NOT NULL,
    type TEXT NOT NULL,
    timestamp TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_movements_mac ON movements (mac);
  CREATE INDEX IF NOT EXISTS idx_movements_timestamp ON movements (timestamp);
`)

function seedIfEmpty(): void {
  const { count } = db.prepare('SELECT COUNT(*) as count FROM beacons').get() as { count: number }
  if (count > 0) return

  const now = new Date().toISOString()

  const beacons = [
    { mac: 'ff233da11223', name: 'Furadeira Industrial #12', type: 'asset', battery: 82 },
    { mac: 'ff233da11224', name: 'Notebook Dell #08', type: 'asset', battery: 45 },
    { mac: 'ff233da11225', name: 'Empilhadeira Elétrica #03', type: 'asset', battery: 12 },
    { mac: 'aa112233cc01', name: 'Crachá - João Silva', type: 'employee', battery: 67 },
    { mac: 'aa112233cc02', name: 'Crachá - Maria Souza', type: 'employee', battery: 90 },
  ]

  const insertBeacon = db.prepare(
    `INSERT INTO beacons (id, mac, name, type, uuid, major, minor, battery_level, tx_power, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
  for (const beacon of beacons) {
    insertBeacon.run(
      `beacon-${beacon.mac}`,
      beacon.mac,
      beacon.name,
      beacon.type,
      'E2C56DB5-DFFB-48D2-B060-D0F5A71096E0',
      1,
      1,
      beacon.battery,
      -59,
      'online',
    )
  }

  const insertAsset = db.prepare(
    `INSERT INTO assets (id, name, category, serial_number, beacon_id, status, assigned_to_employee_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?)`,
  )
  insertAsset.run('asset-1', 'Furadeira Industrial #12', 'Ferramenta', 'PAT-0012', 'ff233da11223', 'active', now, now)
  insertAsset.run('asset-2', 'Notebook Dell #08', 'Equipamento de TI', 'PAT-0008', 'ff233da11224', 'active', now, now)
  insertAsset.run(
    'asset-3',
    'Empilhadeira Elétrica #03',
    'Máquina',
    'PAT-0003',
    'ff233da11225',
    'maintenance',
    now,
    now,
  )
  insertAsset.run('asset-4', 'Projetor Epson #21', 'Equipamento Audiovisual', 'PAT-0021', null, 'active', now, now)

  const insertEmployee = db.prepare(
    `INSERT INTO employees (id, name, registration_number, department, role, beacon_id, status, authorized_zones)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  )
  insertEmployee.run(
    'emp-1',
    'João Silva',
    'F-0001',
    'Manutenção',
    'Técnico Industrial',
    'aa112233cc01',
    'active',
    JSON.stringify(['Almoxarifado', 'Oficina', 'Escritório']),
  )
  insertEmployee.run(
    'emp-2',
    'Maria Souza',
    'F-0002',
    'Administrativo',
    'Analista de Estoque',
    'aa112233cc02',
    'active',
    JSON.stringify(['Escritório', 'Almoxarifado']),
  )
}

function seedGatewaysIfEmpty(): void {
  const { count } = db.prepare('SELECT COUNT(*) as count FROM gateways').get() as { count: number }
  if (count > 0) return

  const insertGateway = db.prepare('INSERT INTO gateways (mac, name, zone) VALUES (?, ?, ?)')
  // Preserva o Gateway real já configurado nesta sessão; os outros dois são placeholders
  // (edite ou apague pela tela de Gateways quando tiver o hardware correspondente).
  insertGateway.run('fce8c0428d80', 'Gateway Escritório', 'Escritório')
  insertGateway.run('ac233fa00001', 'Gateway Almoxarifado (exemplo)', 'Almoxarifado')
  insertGateway.run('ac233fa00002', 'Gateway Oficina (exemplo)', 'Oficina')
}

seedIfEmpty()
seedGatewaysIfEmpty()
