import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  color: 'primary' | 'accent' | 'warning' | 'info'
  trend?: string
}

const colorMap = {
  primary: {
    bg: 'bg-primary-50',
    icon: 'text-primary-600',
  },
  accent: {
    bg: 'bg-accent-50',
    icon: 'text-accent-600',
  },
  warning: {
    bg: 'bg-warning-light',
    icon: 'text-warning',
  },
  info: {
    bg: 'bg-info-light',
    icon: 'text-info',
  },
}

export function StatsCard({ title, value, icon: Icon, color, trend }: StatsCardProps) {
  const colors = colorMap[color]

  return (
    <div className="card-base">
      <div className="flex items-center gap-4">
        <div className={cn('flex h-12 w-12 items-center justify-center rounded-lg', colors.bg)}>
          <Icon className={cn('h-6 w-6', colors.icon)} strokeWidth={1.75} />
        </div>
        <div>
          <p className="text-sm font-medium text-neutral-500">{title}</p>
          <p className="text-2xl font-semibold text-neutral-800">{value}</p>
          {trend && (
            <p className="mt-0.5 text-xs text-neutral-400">{trend}</p>
          )}
        </div>
      </div>
    </div>
  )
}
