import { useState } from 'react'
import { Layout } from './components/Layout'
import { type PageKey } from './components/navigation'
import { DashboardPage } from './pages/DashboardPage'
import { AssetDashboard } from './pages/AssetDashboard'
import { EmployeeTracker } from './pages/EmployeeTracker'
import { BLEScannerPage } from './pages/BLEScannerPage'
import { LoginPage } from './pages/LoginPage'
import { useTrackedEntities } from './hooks/useTrackedEntities'
import { useAuth } from './hooks/useAuth'

const PAGE_TITLES: Record<PageKey, string> = {
  dashboard: 'Dashboard Geral',
  assets: 'Controle de Ativos Imobilizados',
  employees: 'Movimentação de Funcionários',
  'ble-audit': 'Auditoria BLE Local',
}

interface AuthenticatedAppProps {
  onLogout?: () => void
}

// Só monta (e busca dados) depois do login — garante fetch + conexão WS novos a cada sessão,
// em vez de reaproveitar um efeito que rodou antes de existir token válido.
function AuthenticatedApp({ onLogout }: AuthenticatedAppProps) {
  const [activePage, setActivePage] = useState<PageKey>('dashboard')
  const tracked = useTrackedEntities()

  return (
    <Layout
      title={PAGE_TITLES[activePage]}
      activePage={activePage}
      onNavigate={setActivePage}
      connectionStatus={activePage !== 'ble-audit' ? tracked.connectionStatus : undefined}
      onLogout={onLogout}
    >
      {activePage === 'dashboard' && <DashboardPage data={tracked} />}
      {activePage === 'assets' && <AssetDashboard data={tracked} />}
      {activePage === 'employees' && <EmployeeTracker data={tracked} />}
      {activePage === 'ble-audit' && <BLEScannerPage />}
    </Layout>
  )
}

function App() {
  const auth = useAuth()

  if (auth.isChecking) {
    return <div className="min-h-screen bg-slate-950" />
  }

  if (!auth.isAuthenticated) {
    return <LoginPage onLogin={auth.login} error={auth.error} />
  }

  return <AuthenticatedApp onLogout={auth.authRequired ? auth.logout : undefined} />
}

export default App
