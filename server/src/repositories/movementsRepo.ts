import { db } from '../db.js'
import type { ZoneMovementLog } from '../gatewayService.js'

interface MovementRow {
  id: string
  mac: string
  zone: string
  type: string
  timestamp: string
}

function mapRow(row: MovementRow): ZoneMovementLog {
  return { id: row.id, mac: row.mac, zone: row.zone, type: row.type as ZoneMovementLog['type'], timestamp: row.timestamp }
}

export function insertMovements(events: ZoneMovementLog[]): void {
  if (events.length === 0) return

  const insert = db.prepare('INSERT INTO movements (id, mac, zone, type, timestamp) VALUES (?, ?, ?, ?, ?)')
  for (const event of events) {
    insert.run(event.id, event.mac, event.zone, event.type, event.timestamp)
  }
}

export function listMovements(options: { mac?: string; limit?: number } = {}): ZoneMovementLog[] {
  const limit = options.limit ?? 200

  const rows = options.mac
    ? (db
        .prepare('SELECT * FROM movements WHERE mac = ? ORDER BY rowid DESC LIMIT ?')
        .all(options.mac, limit) as unknown as MovementRow[])
    : (db.prepare('SELECT * FROM movements ORDER BY rowid DESC LIMIT ?').all(limit) as unknown as MovementRow[])

  return rows.map(mapRow)
}

/** Reconstrói a última zona confirmada de cada dispositivo a partir do histórico — usado pra "aquecer" o estado ao reiniciar o servidor. */
export function getLatestZonePerMac(): Map<string, string> {
  const rows = db
    .prepare(
      `SELECT mac, zone, type FROM movements
       WHERE rowid IN (SELECT MAX(rowid) FROM movements GROUP BY mac)`,
    )
    .all() as unknown as { mac: string; zone: string; type: string }[]

  const latest = new Map<string, string>()
  for (const row of rows) {
    if (row.type === 'entrada') {
      latest.set(row.mac, row.zone)
    }
  }
  return latest
}
