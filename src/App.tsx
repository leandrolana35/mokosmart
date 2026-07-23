import { useState } from 'react'
import { Layout } from './components/Layout'
import { type PageKey } from './components/navigation'
import { DashboardPage } from './pages/DashboardPage'
import { AssetDashboard } from './pages/AssetDashboard'
import { EmployeeTracker } from './pages/EmployeeTracker'
import { BLEScannerPage } from './pages/BLEScannerPage'
import { useTrackedEntities } from './hooks/useTrackedEntities'

const PAGE_TITLES: Record<PageKey, string> = {
  dashboard: 'Dashboard Geral',
  assets: 'Controle de Ativos Imobilizados',
  employees: 'Movimentação de Funcionários',
  'ble-audit': 'Auditoria BLE Local',
}

function App() {
  const [activePage, setActivePage] = useState<PageKey>('dashboard')
  const tracked = useTrackedEntities()

  return (
    <Layout
      title={PAGE_TITLES[activePage]}
      activePage={activePage}
      onNavigate={setActivePage}
      connectionStatus={activePage !== 'ble-audit' ? tracked.connectionStatus : undefined}
    >
      {activePage === 'dashboard' && <DashboardPage data={tracked} />}
      {activePage === 'assets' && <AssetDashboard data={tracked} />}
      {activePage === 'employees' && <EmployeeTracker data={tracked} />}
      {activePage === 'ble-audit' && <BLEScannerPage />}
    </Layout>
  )
}

export default App
