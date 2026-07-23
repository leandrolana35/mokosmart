import { useCallback, useEffect, useRef, useState } from 'react'

export interface DiscoveredDevice {
  id: string
  name: string | null
  rssi: number | null
  beaconId: string | null
  lastSeenAt: number
}

export interface ConnectedDeviceInfo {
  id: string
  name: string | null
}

interface UseWebBluetoothResult {
  isScanning: boolean
  devicesFound: DiscoveredDevice[]
  connectedDevice: ConnectedDeviceInfo | null
  batteryLevel: number | null
  error: string | null
  isSupported: boolean
  startScan: () => Promise<void>
  stopScan: () => void
  connectToDevice: () => Promise<void>
  disconnectDevice: () => void
}

const APPLE_COMPANY_ID = 0x004c
const BATTERY_SERVICE = 'battery_service'
const BATTERY_LEVEL_CHARACTERISTIC = 'battery_level'

/** Extrai UUID-Major-Minor de um pacote iBeacon (Apple manufacturer data). */
function parseBeaconId(manufacturerData: BluetoothManufacturerDataMap | null): string | null {
  if (!manufacturerData) return null
  const appleData = manufacturerData.get(APPLE_COMPANY_ID)
  if (!appleData || appleData.byteLength < 23) return null
  if (appleData.getUint8(0) !== 0x02 || appleData.getUint8(1) !== 0x15) return null

  let uuid = ''
  for (let i = 2; i < 18; i++) {
    uuid += appleData.getUint8(i).toString(16).padStart(2, '0')
    if ([3, 5, 7, 9].includes(i - 2)) uuid += '-'
  }
  const major = appleData.getUint16(18, false)
  const minor = appleData.getUint16(20, false)

  return `${uuid}-${major}-${minor}`
}

export function useWebBluetooth(): UseWebBluetoothResult {
  const isSupported = typeof navigator !== 'undefined' && 'bluetooth' in navigator

  const [isScanning, setIsScanning] = useState(false)
  const [devicesFound, setDevicesFound] = useState<Map<string, DiscoveredDevice>>(new Map())
  const [connectedDevice, setConnectedDevice] = useState<ConnectedDeviceInfo | null>(null)
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const scanRef = useRef<BluetoothLEScan | null>(null)
  const activeDeviceRef = useRef<BluetoothDevice | null>(null)

  const handleDisconnected = useCallback(() => {
    setConnectedDevice(null)
    setBatteryLevel(null)
    activeDeviceRef.current = null
  }, [])

  useEffect(() => {
    if (!isSupported || !navigator.bluetooth) return

    function handleAdvertisement(event: BluetoothAdvertisingEvent) {
      setDevicesFound((prev) => {
        const next = new Map(prev)
        next.set(event.device.id, {
          id: event.device.id,
          name: event.device.name ?? event.name ?? null,
          rssi: event.rssi ?? null,
          beaconId: parseBeaconId(event.manufacturerData ?? null) ?? event.device.id,
          lastSeenAt: Date.now(),
        })
        return next
      })
    }

    const bluetooth = navigator.bluetooth
    bluetooth.addEventListener('advertisementreceived', handleAdvertisement)
    return () => bluetooth.removeEventListener('advertisementreceived', handleAdvertisement)
  }, [isSupported])

  useEffect(() => {
    return () => {
      scanRef.current?.stop()
      activeDeviceRef.current?.removeEventListener('gattserverdisconnected', handleDisconnected)
      activeDeviceRef.current?.gatt?.disconnect()
    }
  }, [handleDisconnected])

  const startScan = useCallback(async () => {
    if (!isSupported || !navigator.bluetooth) {
      setError('Web Bluetooth não é suportado neste navegador.')
      return
    }

    try {
      setError(null)
      const scan = await navigator.bluetooth.requestLEScan({
        acceptAllAdvertisements: true,
        keepRepeatedDevices: true,
      })
      scanRef.current = scan
      setIsScanning(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao iniciar o scan.')
      setIsScanning(false)
    }
  }, [isSupported])

  const stopScan = useCallback(() => {
    scanRef.current?.stop()
    scanRef.current = null
    setIsScanning(false)
  }, [])

  const connectToDevice = useCallback(async () => {
    if (!isSupported || !navigator.bluetooth) {
      setError('Web Bluetooth não é suportado neste navegador.')
      return
    }

    try {
      setError(null)

      const selectedDevice = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [BATTERY_SERVICE],
      })

      if (!selectedDevice.gatt) {
        throw new Error('O dispositivo selecionado não suporta GATT.')
      }

      selectedDevice.addEventListener('gattserverdisconnected', handleDisconnected)
      activeDeviceRef.current = selectedDevice

      const server = await selectedDevice.gatt.connect()
      setConnectedDevice({ id: selectedDevice.id, name: selectedDevice.name ?? null })

      try {
        const service = await server.getPrimaryService(BATTERY_SERVICE)
        const characteristic = await service.getCharacteristic(BATTERY_LEVEL_CHARACTERISTIC)
        const value = await characteristic.readValue()
        setBatteryLevel(value.getUint8(0))
      } catch {
        setBatteryLevel(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao conectar ao dispositivo.')
    }
  }, [isSupported, handleDisconnected])

  const disconnectDevice = useCallback(() => {
    activeDeviceRef.current?.gatt?.disconnect()
    handleDisconnected()
  }, [handleDisconnected])

  return {
    isScanning,
    devicesFound: Array.from(devicesFound.values()),
    connectedDevice,
    batteryLevel,
    error,
    isSupported,
    startScan,
    stopScan,
    connectToDevice,
    disconnectDevice,
  }
}
