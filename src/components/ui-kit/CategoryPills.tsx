import { cn } from '@/utils'

export interface CategoryOption {
  key: string
  label: string
}

interface CategoryPillsProps {
  options: CategoryOption[]
  value: string
  onChange: (key: string) => void
  className?: string
}

/**
 * 分类胶囊导航，横向可滚动
 */
export default function CategoryPills({ options, value, onChange, className }: CategoryPillsProps) {
  return (
    <div className={cn('scrollbar-hide -mx-1 flex gap-2 overflow-x-auto px-1 py-1', className)}>
      {options.map(option => {
        const active = option.key === value
        return (
          <button
            key={option.key}
            type="button"
            onClick={() => onChange(option.key)}
            className={cn(
              'shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition',
              active
                ? 'bg-brand text-white shadow-[0_6px_18px_-8px_var(--brand)]'
                : 'border border-line bg-surface-2 text-fg-soft hover:border-line-strong hover:text-fg',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
