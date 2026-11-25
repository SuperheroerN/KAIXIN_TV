import type { ReactNode } from 'react'
import { cn } from '@/utils'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

/**
 * 空状态
 */
export default function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-20 text-center', className)}>
      {icon ? <div className="text-muted-fg/50">{icon}</div> : null}
      <p className="text-base font-medium text-fg">{title}</p>
      {description ? <p className="max-w-md text-sm text-muted-fg">{description}</p> : null}
      {action}
    </div>
  )
}
