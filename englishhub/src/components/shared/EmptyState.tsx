import { type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
        <Icon className="h-8 w-8 text-neutral-400" strokeWidth={1.75} />
      </div>
      <h3 className="mt-4 text-base font-semibold text-neutral-700">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-neutral-500">{description}</p>
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="btn-primary mt-4"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
