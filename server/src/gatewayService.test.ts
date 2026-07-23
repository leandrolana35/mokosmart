import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { resolveZones, buildMovementLog, type GatewayPayload } from './gatewayService.js'

const ZONE_MAP: Record<string, string> = {
  'gw-almox': 'Almoxarifado',
  'gw-oficina': 'Oficina',
  'gw-escritorio': 'Escritório',
}

describe('resolveZones', () => {
  test('escolhe a zona do gateway com maior RSSI (sinal mais forte)', () => {
    const payloads: GatewayPayload[] = [
      { gatewaysmac: 'gw-almox', devices: [{ mac: 'beacon-1', rssi: -80 }] },
      { gatewaysmac: 'gw-oficina', devices: [{ mac: 'beacon-1', rssi: -45 }] },
    ]

    const result = resolveZones(payloads, ZONE_MAP)

    assert.equal(result.get('beacon-1')?.zone, 'Oficina')
    assert.equal(result.get('beacon-1')?.rssi, -45)
  })

  test('ignora payloads de gateways não mapeados', () => {
    const payloads: GatewayPayload[] = [{ gatewaysmac: 'gw-desconhecido', devices: [{ mac: 'beacon-1', rssi: -50 }] }]

    const result = resolveZones(payloads, ZONE_MAP)

    assert.equal(result.size, 0)
  })

  test('resolve zonas independentes para múltiplos dispositivos', () => {
    const payloads: GatewayPayload[] = [
      {
        gatewaysmac: 'gw-almox',
        devices: [
          { mac: 'beacon-1', rssi: -50 },
          { mac: 'beacon-2', rssi: -90 },
        ],
      },
      { gatewaysmac: 'gw-escritorio', devices: [{ mac: 'beacon-2', rssi: -40 }] },
    ]

    const result = resolveZones(payloads, ZONE_MAP)

    assert.equal(result.get('beacon-1')?.zone, 'Almoxarifado')
    assert.equal(result.get('beacon-2')?.zone, 'Escritório')
  })
})

describe('buildMovementLog', () => {
  test('não gera evento quando a zona não muda', () => {
    const current = new Map([['beacon-1', { mac: 'beacon-1', zone: 'Almoxarifado', rssi: -50 }]])
    const previous = new Map([['beacon-1', 'Almoxarifado']])

    const events = buildMovementLog(current, previous)

    assert.equal(events.length, 0)
  })

  test('gera só "entrada" quando o dispositivo não tinha zona anterior', () => {
    const current = new Map([['beacon-1', { mac: 'beacon-1', zone: 'Almoxarifado', rssi: -50 }]])
    const previous = new Map<string, string>()

    const events = buildMovementLog(current, previous)

    assert.equal(events.length, 1)
    assert.equal(events[0].type, 'entrada')
    assert.equal(events[0].zone, 'Almoxarifado')
  })

  test('gera "saida" da zona antiga seguida de "entrada" na nova quando a zona muda', () => {
    const current = new Map([['beacon-1', { mac: 'beacon-1', zone: 'Oficina', rssi: -50 }]])
    const previous = new Map([['beacon-1', 'Almoxarifado']])

    const events = buildMovementLog(current, previous)

    assert.equal(events.length, 2)
    assert.equal(events[0].type, 'saida')
    assert.equal(events[0].zone, 'Almoxarifado')
    assert.equal(events[1].type, 'entrada')
    assert.equal(events[1].zone, 'Oficina')
  })

  test('não gera evento para dispositivos que já não aparecem mais (saíram de alcance)', () => {
    const current = new Map()
    const previous = new Map([['beacon-1', 'Almoxarifado']])

    const events = buildMovementLog(current, previous)

    assert.equal(events.length, 0)
  })
})
