import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink } from 'react-router'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import { useViewingHistoryStore } from '@/store/viewingHistoryStore'
import { getPlaceholderImageUrl, getProxiedImageUrl, handleImageError } from '@/utils/imageProxy'
import { CloseIcon, RecentIcon, TrashIcon } from '@/components/icons'
import type { ViewingHistoryItem } from '@/types'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')
dayjs.extend(duration)

const formatEpisodeDisplay = (item: ViewingHistoryItem): string => {
  if (item.episodeName) return item.episodeName
  return `第${item.episodeIndex + 1}集`
}

export default function RecentHistory() {
  const [open, setOpen] = useState(false)
  const viewingHistory = useViewingHistoryStore(state => state.viewingHistory)
  const removeViewingHistory = useViewingHistoryStore(state => state.removeViewingHistory)
  const clearViewingHistory = useViewingHistoryStore(state => state.clearViewingHistory)
  const containerRef = useRef<HTMLDivElement>(null)

  const items = useMemo(() => {
    const seen = new Set<string>()
    return viewingHistory.filter(item => {
      const key = `${item.sourceCode}-${item.vodId}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [viewingHistory])

  useEffect(() => {
    if (!open) return
    const onClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="观看记录"
        onClick={() => setOpen(value => !value)}
        className="flex h-9 w-9 items-center justify-center rounded-full text-fg-soft transition hover:text-fg"
      >
        <RecentIcon size={20} />
      </button>

      {open ? (
        <div className="absolute top-11 right-0 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-line bg-surface shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between border-b border-line px-3 py-2.5">
            <span className="text-sm font-semibold text-fg">观看记录</span>
            {items.length > 0 ? (
              <button
                type="button"
                onClick={clearViewingHistory}
                className="flex items-center gap-1 text-[11px] text-muted-fg transition hover:text-brand"
              >
                <CloseIcon size={12} />
                清除历史
              </button>
            ) : null}
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <span className="text-muted-fg/40">
                <RecentIcon size={40} />
              </span>
              <p className="text-sm text-muted-fg">还没有观看记录</p>
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto p-1.5">
              {items.map(item => (
                <div
                  key={`${item.sourceCode}-${item.vodId}`}
                  className="group flex items-center gap-2.5 rounded-lg p-1.5 transition hover:bg-surface-2"
                >
                  <NavLink
                    to={`/video/${item.sourceCode}/${item.vodId}/${item.episodeIndex}`}
                    onClick={() => setOpen(false)}
                    className="flex min-w-0 flex-1 items-center gap-2.5"
                  >
                    <span className="relative h-14 w-10 shrink-0 overflow-hidden rounded-md bg-surface-3">
                      <img
                        alt={item.title}
                        loading="lazy"
                        className="h-full w-full object-cover"
                        src={getProxiedImageUrl(item.imageUrl) || getPlaceholderImageUrl('')}
                        data-original-url={item.imageUrl}
                        onError={e => handleImageError(e, item.title)}
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-fg">
                        {item.title}
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] text-muted-fg">
                        {formatEpisodeDisplay(item)} · {item.sourceName}
                      </span>
                      <span className="mt-1 flex items-center gap-1.5">
                        <span className="h-1 flex-1 overflow-hidden rounded-full bg-surface-3">
                          <span
                            className="block h-full rounded-full bg-brand"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(2, (item.playbackPosition / (item.duration || 1)) * 100),
                              )}%`,
                            }}
                          />
                        </span>
                        <span className="shrink-0 text-[10px] text-muted-fg">
                          {dayjs(item.timestamp).fromNow()}
                        </span>
                      </span>
                    </span>
                  </NavLink>

                  <button
                    type="button"
                    aria-label="删除记录"
                    onClick={() => removeViewingHistory(item)}
                    className="shrink-0 rounded-full p-1.5 text-muted-fg opacity-0 transition group-hover:opacity-100 hover:text-brand"
                  >
                    <TrashIcon size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
