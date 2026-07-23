import { useWebBluetooth } from '../hooks/useWebBluetooth'

export function BLEScannerPage() {
  const {
    isScanning,
    devicesFound,
    connectedDevice,
    batteryLevel,
    error,
    isSupported,
    startScan,
    stopScan,
    connectToDevice,
    disconnectDevice,
  } = useWebBluetooth()

  if (!isSupported) {
    return (
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-amber-300">
        Web Bluetooth não é suportado neste navegador. Use Chrome ou Edge em HTTPS ou localhost.
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <section className="bg-slate-900 rounded-lg border border-slate-800 p-4">
        <h2 className="text-sm font-semibold text-slate-200 mb-3">Scan Passivo</h2>
        <div className="flex items-center gap-3 mb-4">
          <button
            type="button"
            onClick={isScanning ? stopScan : startScan}
            className={`px-4 py-2 rounded-md text-sm font-medium text-white transition-colors ${
              isScanning ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isScanning ? 'Parar Scan' : 'Iniciar Scan'}
          </button>
          <span className="text-sm text-slate-500">{devicesFound.length} dispositivo(s) encontrado(s)</span>
        </div>

        <ul className="divide-y divide-slate-800">
          {devicesFound.map((device) => (
            <li key={device.id} className="py-2 text-sm">
              <p className="font-medium text-slate-200">{device.name ?? 'Sem nome'}</p>
              <p className="text-slate-500">
                RSSI: {device.rssi ?? '—'} · Beacon ID: {device.beaconId ?? '—'}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-slate-900 rounded-lg border border-slate-800 p-4">
        <h2 className="text-sm font-semibold text-slate-200 mb-3">Conexão GATT Ativa</h2>
        <div className="flex items-center gap-3 mb-4">
          <button
            type="button"
            onClick={connectedDevice ? disconnectDevice : connectToDevice}
            className={`px-4 py-2 rounded-md text-sm font-medium text-white transition-colors ${
              connectedDevice ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {connectedDevice ? 'Desconectar' : 'Conectar Dispositivo'}
          </button>
        </div>

        {connectedDevice && (
          <div className="text-sm text-slate-300 space-y-1">
            <p>
              <span className="font-medium text-slate-200">Dispositivo:</span>{' '}
              {connectedDevice.name ?? connectedDevice.id}
            </p>
            <p>
              <span className="font-medium text-slate-200">Bateria:</span>{' '}
              {batteryLevel !== null ? `${batteryLevel}%` : 'indisponível'}
            </p>
          </div>
        )}
      </section>

      {error && <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-md p-3">{error}</p>}
    </div>
  )
}
