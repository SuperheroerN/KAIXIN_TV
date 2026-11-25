import { cn } from '@/utils'

interface PosterGridProps {
  children: React.ReactNode
  className?: string
}

/**
 * 海报网格：手机 2 列，桌面最多 6 列
 */
export default function PosterGrid({ children, className }: PosterGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6',
        className,
      )}
    >
      {children}
    </div>
  )
}

interface PosterGridSkeletonProps {
  count?: number
  className?: string
}

export function PosterGridSkeleton({ count = 12, className }: PosterGridSkeletonProps) {
  return (
    <PosterGrid className={className}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="space-y-2">
          <div className="aspect-[2/3] animate-pulse rounded-xl bg-surface-2" />
          <div className="h-3.5 w-4/5 animate-pulse rounded bg-surface-2" />
        </div>
      ))}
    </PosterGrid>
  )
}
