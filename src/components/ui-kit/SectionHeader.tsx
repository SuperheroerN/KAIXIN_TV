import { cn } from '@/utils'

interface SectionHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

/**
 * 内容区块标题
 */
export default function SectionHeader({ title, description, action, className }: SectionHeaderProps) {
  return (
    <div className={cn('mb-4 flex items-end justify-between gap-3', className)}>
      <div className="flex items-center gap-2.5">
        <span className="h-5 w-1 rounded-full bg-brand" />
        <h2 className="text-lg font-semibold tracking-tight text-fg sm:text-xl">{title}</h2>
        {description ? <span className="text-xs text-muted-fg">{description}</span> : null}
      </div>
      {action}
    </div>
  )
}
