import type { ReactNode } from 'react'
import { cn } from '@/utils'

type IconButtonProps = {
  children: ReactNode
  label: string
  onClick?: () => void
  className?: string
  active?: boolean
}

/**
 * 顶部栏通用图标按钮
 */
export default function IconButton({ children, label, onClick, className, active }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-full border border-transparent text-fg-soft transition',
        'hover:border-line hover:bg-surface-2 hover:text-fg',
        'focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none',
        active && 'border-line bg-surface-2 text-fg',
        className,
      )}
    >
      {children}
    </button>
  )
}
