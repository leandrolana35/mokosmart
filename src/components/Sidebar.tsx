import { Radio } from 'lucide-react'
import { NAV_ITEMS, type PageKey } from './navigation'

interface SidebarProps {
  activePage: PageKey
  onNavigate: (page: PageKey) => void
}

export function Sidebar({ activePage, onNavigate }: SidebarProps) {
  return (
    <aside className="hidden md:flex md:w-64 md:flex-col bg-slate-950 text-slate-300 border-r border-slate-800">
      <div className="flex items-center gap-2 px-6 h-16 border-b border-slate-800">
        <Radio className="size-6 text-blue-400" />
        <span className="text-lg font-semibold text-white">MokoSmart</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
          const isActive = key === activePage
          return (
            <button
              key={key}
              type="button"
              onClick={() => onNavigate(key)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Icon className="size-5" />
              {label}
            </button>
          )
        })}
      </nav>

      <div className="px-6 py-4 text-xs text-slate-600 border-t border-slate-800">v0.0.0</div>
    </aside>
  )
}
