import type { LucideIcon } from 'lucide-react'

type KpiTone = 'default' | 'success' | 'warning' | 'danger'

interface KpiCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  tone?: KpiTone
}

const TONE_CLASSES: Record<KpiTone, string> = {
  default: 'bg-blue-500/15 text-blue-400',
  success: 'bg-emerald-500/15 text-emerald-400',
  warning: 'bg-amber-500/15 text-amber-400',
  danger: 'bg-red-500/15 text-red-400',
}

export function KpiCard({ label, value, icon: Icon, tone = 'default' }: KpiCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-slate-800 bg-slate-900 p-4">
      <div className={`flex size-10 items-center justify-center rounded-lg ${TONE_CLASSES[tone]}`}>
        <Icon className="size-5" />
      </div>
      <div>
        <p className="text-2xl font-semibold text-white">{value}</p>
        <p className="text-xs text-slate-400">{label}</p>
      </div>
    </div>
  )
}
