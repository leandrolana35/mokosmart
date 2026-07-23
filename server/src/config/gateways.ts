export interface GatewayConfig {
  mac: string
  zone: string
}

// TODO: substitua pelos MACs reais dos Gateways MOKO instalados em campo
// (o MAC de cada Gateway aparece no app MOKO Configuration Tool ou na etiqueta do aparelho).
export const GATEWAY_CONFIG: GatewayConfig[] = [
  { mac: 'AC233FA00001', zone: 'Almoxarifado' },
  { mac: 'AC233FA00002', zone: 'Oficina' },
  { mac: 'AC233FA00003', zone: 'Escritório' },
]

export const GATEWAY_ZONE_MAP: Record<string, string> = Object.fromEntries(
  GATEWAY_CONFIG.map((gateway) => [gateway.mac, gateway.zone]),
)
