import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useApiStore } from '@/store/apiStore'
import { useViewingHistoryStore } from '@/store/viewingHistoryStore'
import { loadHomeFeed, type FeedItem, type HomeFeed } from '@/services/feed.service'
import { useSearch } from '@/hooks'
import {
  CategoryPills,
  EmptyState,
  PosterCard,
  PosterGrid,
  PosterGridSkeleton,
  RankList,
  SectionHeader,
  TopBar,
} from '@/components/ui-kit'
import { NoItemIcon } from '@/components/icons'
import { getProxiedImageUrl, handleImageError } from '@/utils/imageProxy'

// 主要分类（显示在胶囊导航）
const MAIN_CATEGORIES = [
  { key: 'hot', label: '热门' },
  { key: 'latest', label: '最新' },
  { key: 'classic', label: '经典' },
  { key: 'high-score', label: '豆瓣高分' },
  { key: 'movie', label: '电影' },
  { key: 'tv', label: '电视剧' },
]

// 更多分类，按组展示
const MORE_CATEGORY_GROUPS = [
  {
    label: '电影类型',
    items: [
      { key: 'action', label: '动作' },
      { key: 'comedy', label: '喜剧' },
      { key: 'romance', label: '爱情' },
      { key: 'scifi', label: '科幻' },
      { key: 'suspense', label: '悬疑' },
      { key: 'horror', label: '恐怖' },
      { key: 'art', label: '文艺' },
    ],
  },
  {
    label: '地区',
    items: [
      { key: 'chinese', label: '华语' },
      { key: 'western', label: '欧美' },
      { key: 'korean', label: '韩国' },
      { key: 'japanese', label: '日本' },
    ],
  },
  {
    label: '剧集',
    items: [
      { key: 'us-drama', label: '美剧' },
      { key: 'uk-drama', label: '英剧' },
      { key: 'kr-drama', label: '韩剧' },
      { key: 'jp-drama', label: '日剧' },
      { key: 'cn-drama', label: '国产剧' },
      { key: 'hk-drama', label: '港剧' },
    ],
  },
  {
    label: '其他',
    items: [
      { key: 'anime', label: '日本动画' },
      { key: 'variety', label: '综艺' },
      { key: 'documentary', label: '纪录片' },
      { key: 'hidden-gem', label: '冷门佳片' },
    ],
  },
]

export default function App() {
  const navigate = useNavigate()
  const { searchMovie } = useSearch()
  const videoAPIs = useApiStore(state => state.videoAPIs)
  const viewingHistory = useViewingHistoryStore(state => state.viewingHistory)

  const [selectedCategory, setSelectedCategory] = useState('hot')
  const [feed, setFeed] = useState<HomeFeed>({ items: [], source: 'none' })
  const [loading, setLoading] = useState(true)
  const [moreOpen, setMoreOpen] = useState(false)
  const requestSeq = useRef(0)

  const loadFeed = useCallback(async () => {
    const seq = ++requestSeq.current
    setLoading(true)

    try {
      const result = await loadHomeFeed(selectedCategory, videoAPIs)
      if (seq !== requestSeq.current) return
      setFeed(result)
    } catch (error) {
      console.error('❌ [首页加载] 加载失败:', error)
      if (seq !== requestSeq.current) return
      setFeed({ items: [], source: 'none' })
    } finally {
      if (seq === requestSeq.current) setLoading(false)
    }
  }, [selectedCategory, videoAPIs])

  useEffect(() => {
    loadFeed()
  }, [loadFeed])

  const categoryLabel = useMemo(() => {
    const all = [...MAIN_CATEGORIES, ...MORE_CATEGORY_GROUPS.flatMap(group => group.items)]
    return all.find(item => item.key === selectedCategory)?.label ?? '推荐'
  }, [selectedCategory])

  const handleFeedClick = (item: FeedItem) => {
    if (item.href) {
      navigate(item.href)
      return
    }
    searchMovie(item.title)
  }

  // 最近观看去重后取前 8 条
  const recentItems = useMemo(() => {
    const seen = new Set<string>()
    return viewingHistory
      .filter(item => {
        const key = `${item.sourceCode}-${item.vodId}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .slice(0, 8)
  }, [viewingHistory])

  return (
    <div className="min-h-dvh bg-app">
      <TopBar />

      <main className="mx-auto max-w-[1440px] px-4 pb-20 md:px-6">
        {recentItems.length > 0 ? (
          <section className="pt-6">
            <SectionHeader title="继续观看" description="接着上次的进度" />
            <div className="scrollbar-hide -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
              {recentItems.map(item => (
                <button
                  key={`${item.sourceCode}-${item.vodId}`}
                  type="button"
                  onClick={() => navigate(`/video/${item.sourceCode}/${item.vodId}/${item.episodeIndex}`)}
                  className="group flex w-72 shrink-0 items-center gap-3 rounded-xl border border-line bg-surface p-2 text-left transition hover:border-line-strong"
                >
                  <span className="relative h-20 w-14 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                    <img
                      alt={item.title}
                      loading="lazy"
                      className="h-full w-full object-cover"
                      src={getProxiedImageUrl(item.imageUrl)}
                      data-original-url={item.imageUrl}
                      onError={e => handleImageError(e, item.title)}
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-fg">{item.title}</span>
                    <span className="mt-1 block truncate text-xs text-muted-fg">
                      {item.episodeName || `第${item.episodeIndex + 1}集`} · {item.sourceName}
                    </span>
                    <span className="mt-2 block h-1 w-full overflow-hidden rounded-full bg-surface-3">
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
                  </span>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        <section className="pt-6">
          <div className="flex items-center gap-2">
            <CategoryPills
              options={MAIN_CATEGORIES}
              value={selectedCategory}
              onChange={key => setSelectedCategory(key)}
              className="flex-1"
            />

            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setMoreOpen(open => !open)}
                className="flex items-center gap-1 rounded-full border border-line bg-surface-2 px-3.5 py-1.5 text-[13px] font-medium text-fg-soft transition hover:text-fg"
              >
                更多分类
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {moreOpen ? (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMoreOpen(false)} />
                  <div className="absolute top-11 right-0 z-50 w-72 rounded-xl border border-line bg-surface p-3 shadow-[var(--shadow-card)]">
                    {MORE_CATEGORY_GROUPS.map(group => (
                      <div key={group.label} className="mb-2 last:mb-0">
                        <p className="px-1 pb-1 text-[11px] font-medium tracking-wide text-muted-fg">
                          {group.label}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {group.items.map(item => (
                            <button
                              key={item.key}
                              type="button"
                              onClick={() => {
                                setSelectedCategory(item.key)
                                setMoreOpen(false)
                              }}
                              className={`rounded-md px-2 py-1 text-xs transition ${
                                selectedCategory === item.key
                                  ? 'bg-brand text-white'
                                  : 'bg-surface-2 text-fg-soft hover:text-fg'
                              }`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section>
            <SectionHeader
              title={categoryLabel}
              description={feed.source === 'douban' ? '豆瓣推荐' : undefined}
              action={
                <button
                  type="button"
                  onClick={loadFeed}
                  className="flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-xs text-fg-soft transition hover:border-line-strong hover:text-fg"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-3-6.7M21 3v6h-6" />
                  </svg>
                  换一批
                </button>
              }
            />

            {feed.note && !loading ? (
              <p className="mb-3 rounded-lg border border-line bg-surface-2 px-3 py-2 text-xs text-muted-fg">
                {feed.note}
              </p>
            ) : null}

            {loading ? (
              <PosterGridSkeleton count={18} />
            ) : feed.items.length > 0 ? (
              <PosterGrid>
                {feed.items.map((item, index) => (
                  <PosterCard
                    key={item.key}
                    title={item.title}
                    cover={item.cover}
                    badge={item.remarks}
                    rating={item.rate}
                    onPress={() => handleFeedClick(item)}
                    style={{ animationDelay: `${Math.min(index, 12) * 25}ms` }}
                    className="animate-in fade-in duration-500"
                  />
                ))}
              </PosterGrid>
            ) : (
              <EmptyState
                icon={<NoItemIcon size={96} />}
                title="暂无内容"
                description="换个分类试试，或者确认视频源是否可用。"
                action={
                  <button
                    type="button"
                    onClick={loadFeed}
                    className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                  >
                    重新加载
                  </button>
                }
              />
            )}
          </section>

          <aside className="hidden xl:block">
            <div className="sticky top-20 rounded-2xl border border-line bg-surface p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-fg">本周热榜</h3>
                <span className="text-[11px] text-muted-fg">{categoryLabel}</span>
              </div>
              <RankList
                items={feed.items.slice(0, 10).map(item => ({
                  key: item.key,
                  title: item.title,
                  subtitle: item.rate ?? item.remarks,
                  cover: item.cover,
                  onPress: () => handleFeedClick(item),
                }))}
              />
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
