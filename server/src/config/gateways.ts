export interface GatewayConfig {
  mac: string
  zone: string
}

// TODO: substitua pelos MACs reais dos Gateways MKGW3.
// O MAC usado aqui é o "WIFI MAC" / Client ID que aparece em Device Information no app
// MKScannerPro (ou na etiqueta do aparelho) — minúsculas, sem separador (ex: "4c11ae8be624"),
// igual ao "device_info.mac" que o Gateway manda em toda mensagem MQTT.
export const GATEWAY_CONFIG: GatewayConfig[] = [
  { mac: 'ac233fa00001', zone: 'Almoxarifado' },
  { mac: 'ac233fa00002', zone: 'Oficina' },
  { mac: 'ac233fa00003', zone: 'Escritório' },
]

export const GATEWAY_ZONE_MAP: Record<string, string> = Object.fromEntries(
  GATEWAY_CONFIG.map((gateway) => [gateway.mac, gateway.zone]),
)
