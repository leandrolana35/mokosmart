import { LayoutDashboard, Package, Users, ScanLine, Radio, type LucideIcon } from 'lucide-react'

export type PageKey = 'dashboard' | 'assets' | 'employees' | 'gateways' | 'ble-audit'

interface NavItem {
  key: PageKey
  label: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'assets', label: 'Ativos', icon: Package },
  { key: 'employees', label: 'Funcionários', icon: Users },
  { key: 'gateways', label: 'Gateways', icon: Radio },
  { key: 'ble-audit', label: 'Auditoria BLE', icon: ScanLine },
]
