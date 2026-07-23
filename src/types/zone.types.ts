export const ZONES = ['Almoxarifado', 'Oficina', 'Escritório'] as const
export type Zone = (typeof ZONES)[number]

export interface ZoneInfo {
  id: Zone
  label: string
  restricted: boolean
}

export const ZONE_INFO: Record<Zone, ZoneInfo> = {
  Almoxarifado: { id: 'Almoxarifado', label: 'Almoxarifado', restricted: false },
  Oficina: { id: 'Oficina', label: 'Oficina de Alta Tensão', restricted: true },
  Escritório: { id: 'Escritório', label: 'Escritório', restricted: false },
}
