export {}

declare global {
  type BluetoothServiceUUID = number | string
  type BluetoothCharacteristicUUID = number | string

  type BluetoothManufacturerDataMap = Map<number, DataView>
  type BluetoothServiceDataMap = Map<string, DataView>

  interface BluetoothLEScanFilter {
    services?: BluetoothServiceUUID[]
    name?: string
    namePrefix?: string
  }

  interface BluetoothLEScanOptions {
    filters?: BluetoothLEScanFilter[]
    acceptAllAdvertisements?: boolean
    keepRepeatedDevices?: boolean
  }

  interface BluetoothLEScan extends BluetoothLEScanOptions {
    readonly active: boolean
    stop(): void
  }

  interface BluetoothAdvertisingEvent extends Event {
    readonly device: BluetoothDevice
    readonly uuids: string[]
    readonly manufacturerData: BluetoothManufacturerDataMap
    readonly serviceData: BluetoothServiceDataMap
    readonly name?: string
    readonly appearance?: number
    readonly txPower?: number
    readonly rssi?: number
  }

  interface BluetoothCharacteristicProperties {
    readonly broadcast: boolean
    readonly read: boolean
    readonly writeWithoutResponse: boolean
    readonly write: boolean
    readonly notify: boolean
    readonly indicate: boolean
    readonly authenticatedSignedWrites: boolean
    readonly reliableWrite: boolean
    readonly writableAuxiliaries: boolean
  }

  interface BluetoothRemoteGATTCharacteristic extends EventTarget {
    readonly service: BluetoothRemoteGATTService
    readonly uuid: string
    readonly properties: BluetoothCharacteristicProperties
    readonly value?: DataView
    readValue(): Promise<DataView>
    writeValue(value: BufferSource): Promise<void>
    writeValueWithResponse(value: BufferSource): Promise<void>
    writeValueWithoutResponse(value: BufferSource): Promise<void>
    startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>
    stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>
  }

  interface BluetoothRemoteGATTService extends EventTarget {
    readonly device: BluetoothDevice
    readonly uuid: string
    readonly isPrimary: boolean
    getCharacteristic(characteristic: BluetoothCharacteristicUUID): Promise<BluetoothRemoteGATTCharacteristic>
    getCharacteristics(characteristic?: BluetoothCharacteristicUUID): Promise<BluetoothRemoteGATTCharacteristic[]>
  }

  interface BluetoothRemoteGATTServer {
    readonly device: BluetoothDevice
    readonly connected: boolean
    connect(): Promise<BluetoothRemoteGATTServer>
    disconnect(): void
    getPrimaryService(service: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService>
    getPrimaryServices(service?: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService[]>
  }

  interface BluetoothDeviceEventMap {
    gattserverdisconnected: Event
    advertisementreceived: BluetoothAdvertisingEvent
  }

  interface BluetoothDevice extends EventTarget {
    readonly id: string
    readonly name?: string
    readonly gatt?: BluetoothRemoteGATTServer
    addEventListener<K extends keyof BluetoothDeviceEventMap>(
      type: K,
      listener: (this: BluetoothDevice, ev: BluetoothDeviceEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void
    removeEventListener<K extends keyof BluetoothDeviceEventMap>(
      type: K,
      listener: (this: BluetoothDevice, ev: BluetoothDeviceEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void
  }

  interface RequestDeviceOptions {
    filters?: BluetoothLEScanFilter[]
    optionalServices?: BluetoothServiceUUID[]
    acceptAllDevices?: boolean
  }

  interface BluetoothEventMap {
    advertisementreceived: BluetoothAdvertisingEvent
  }

  interface Bluetooth extends EventTarget {
    getAvailability(): Promise<boolean>
    requestDevice(options?: RequestDeviceOptions): Promise<BluetoothDevice>
    requestLEScan(options?: BluetoothLEScanOptions): Promise<BluetoothLEScan>
    getDevices(): Promise<BluetoothDevice[]>
    addEventListener<K extends keyof BluetoothEventMap>(
      type: K,
      listener: (this: Bluetooth, ev: BluetoothEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions,
    ): void
    removeEventListener<K extends keyof BluetoothEventMap>(
      type: K,
      listener: (this: Bluetooth, ev: BluetoothEventMap[K]) => void,
      options?: boolean | EventListenerOptions,
    ): void
  }

  interface Navigator {
    readonly bluetooth?: Bluetooth
  }
}
