import { getPlaceholderImageUrl, getProxiedImageUrl, handleImageError } from '@/utils/imageProxy'
import { cn } from '@/utils'

export interface PosterCardProps {
  title: string
  cover?: string
  // 角标：更新至 12 集 / HD / 正片
  badge?: string
  // 豆瓣评分
  rating?: string
  // 卡片下方的附加信息（来源等）
  subtitle?: string
  // 右上角名次
  rank?: number
  // 悬停时显示播放图标
  showPlayIcon?: boolean
  onPress?: () => void
  className?: string
  style?: React.CSSProperties
}

/**
 * 统一的海报卡片：首页、搜索结果、继续观看都用它
 */
export default function PosterCard({
  title,
  cover,
  badge,
  rating,
  subtitle,
  rank,
  showPlayIcon = true,
  onPress,
  className,
  style,
}: PosterCardProps) {
  return (
    <button
      type="button"
      onClick={onPress}
      style={style}
      className={cn('group block w-full text-left focus:outline-none', className)}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-line/60 bg-surface-2 shadow-[var(--shadow-card)]">
        <img
          alt={title}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.06]"
          src={getProxiedImageUrl(cover || '') || getPlaceholderImageUrl('暂无封面')}
          data-original-url={cover}
          onError={e => handleImageError(e, title)}
        />

        {/* 底部渐变，保证标题可读 */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent opacity-95" />

        {typeof rank === 'number' && (
          <span className="absolute top-2 left-2 flex h-6 min-w-6 items-center justify-center rounded-md bg-brand px-1.5 text-xs font-bold text-white shadow">
            {rank}
          </span>
        )}

        {rating ? (
          <span className="absolute top-2 right-2 rounded-md bg-black/65 px-1.5 py-0.5 text-[11px] font-semibold text-gold backdrop-blur">
            ★ {rating}
          </span>
        ) : null}

        {showPlayIcon && (
          <span className="absolute inset-0 flex items-center justify-center opacity-0 transition duration-300 group-hover:opacity-100">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/40 backdrop-blur">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </span>
        )}

        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-2.5">
          {badge ? (
            <span className="w-fit max-w-full truncate rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur">
              {badge}
            </span>
          ) : null}
          <p className="line-clamp-2 text-[13px] leading-snug font-medium text-white drop-shadow">
            {title}
          </p>
        </div>
      </div>

      {subtitle ? (
        <p className="mt-1.5 truncate px-0.5 text-[11px] text-muted-fg">{subtitle}</p>
      ) : null}
    </button>
  )
}
