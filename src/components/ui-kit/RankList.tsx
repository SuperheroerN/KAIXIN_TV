import { getPlaceholderImageUrl, getProxiedImageUrl, handleImageError } from '@/utils/imageProxy'
import { cn } from '@/utils'

export interface RankListItem {
  key: string
  title: string
  subtitle?: string
  cover?: string
  onPress: () => void
}

interface RankListProps {
  items: RankListItem[]
  className?: string
}

/**
 * 本周排行：大序号 + 缩略海报 + 标题
 */
export default function RankList({ items, className }: RankListProps) {
  if (items.length === 0) return null

  return (
    <ol className={cn('flex flex-col gap-1', className)}>
      {items.map((item, index) => {
        const rank = index + 1
        return (
          <li key={item.key}>
            <button
              type="button"
              onClick={item.onPress}
              className="group flex w-full items-center gap-3 rounded-lg px-1.5 py-1.5 text-left transition hover:bg-surface-2"
            >
              <span
                className={cn(
                  'w-6 shrink-0 text-center font-mono text-sm font-bold tabular-nums',
                  rank <= 3 ? 'text-brand' : 'text-muted-fg/70',
                )}
              >
                {rank}
              </span>
              <span className="relative h-14 w-10 shrink-0 overflow-hidden rounded-md bg-surface-3">
                <img
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                  src={getProxiedImageUrl(item.cover || '') || getPlaceholderImageUrl('')}
                  data-original-url={item.cover}
                  onError={e => handleImageError(e, item.title)}
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-fg group-hover:text-brand">
                  {item.title}
                </span>
                {item.subtitle ? (
                  <span className="mt-0.5 block truncate text-[11px] text-muted-fg">
                    {item.subtitle}
                  </span>
                ) : null}
              </span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}
