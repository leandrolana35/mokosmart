import type { ReactNode } from 'react'

type BadgeTone = 'green' | 'amber' | 'red' | 'slate' | 'blue'

interface BadgeProps {
  children: ReactNode
  tone?: BadgeTone
}

const TONE_CLASSES: Record<BadgeTone, string> = {
  green: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  amber: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  red: 'bg-red-500/15 text-red-400 border-red-500/30',
  slate: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  blue: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
}

export function Badge({ children, tone = 'slate' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${TONE_CLASSES[tone]}`}
    >
      {children}
    </span>
  )
}
