import { useParams, useNavigate, useLocation } from 'react-router'
import { useState, useEffect, useMemo } from 'react'
import { apiService } from '@/services/api.service'
import { type DetailResponse, type VideoItem } from '@/types'
import { useApiStore } from '@/store/apiStore'
import { useDocumentTitle } from '@/hooks'
import { motion } from 'framer-motion'
import { getPlaceholderImageUrl, getProxiedImageUrl, handleImageError } from '@/utils/imageProxy'
import { cn, htmlToText } from '@/utils'

export default function Detail() {
  const { sourceCode, vodId } = useParams<{ sourceCode: string; vodId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  // 从搜索结果点进来时，先用手上已有的标题/封面占位，避免出现"空白页等半天"
  const preview = (location.state as { item?: VideoItem } | null)?.item
  const videoAPIs = useApiStore(state => state.videoAPIs)

  const [detail, setDetail] = useState<DetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [isReversed, setIsReversed] = useState(false)
  const [currentPageRange, setCurrentPageRange] = useState<string>('')
  const [episodesPerPage, setEpisodesPerPage] = useState(120)

  useEffect(() => {
    const calculateEpisodesPerPage = () => {
      const width = window.innerWidth
      let cols = 2
      let rows = 12

      if (width >= 1024) {
        cols = 10
        rows = 12
      } else if (width >= 768) {
        cols = 8
        rows = 12
      } else if (width >= 640) {
        cols = 6
        rows = 12
      }

      setEpisodesPerPage(cols * rows)
    }

    calculateEpisodesPerPage()
    window.addEventListener('resize', calculateEpisodesPerPage)
    return () => window.removeEventListener('resize', calculateEpisodesPerPage)
  }, [])

  useDocumentTitle(detail?.videoInfo?.title || '视频详情')

  const title = detail?.videoInfo?.title || preview?.vod_name || ''
  const cover = detail?.videoInfo?.cover || preview?.vod_pic || ''
  const year = detail?.videoInfo?.year || ''
  const area = detail?.videoInfo?.area || ''
  const type = detail?.videoInfo?.type || ''
  const director = detail?.videoInfo?.director || ''
  const actor = detail?.videoInfo?.actor || ''
  const sourceName = detail?.videoInfo?.source_name || ''
  const remarks = detail?.videoInfo?.remarks || ''
  const content = detail?.videoInfo?.desc || ''

  const pageRanges = useMemo(() => {
    const totalEpisodes = detail?.videoInfo?.episodes_names?.length || 0
    if (totalEpisodes === 0) return []

    const ranges: { label: string; value: string; start: number; end: number }[] = []

    for (let i = 0; i < totalEpisodes; i += episodesPerPage) {
      const start = i
      const end = Math.min(i + episodesPerPage - 1, totalEpisodes - 1)

      ranges.push({
        label: isReversed ? `${totalEpisodes - start}-${totalEpisodes - end}` : `${start + 1}-${end + 1}`,
        value: `${start}-${end}`,
        start,
        end,
      })
    }

    return ranges
  }, [detail?.videoInfo?.episodes_names?.length, episodesPerPage, isReversed])

  const currentPageEpisodes = useMemo(() => {
    if (!currentPageRange || !detail?.videoInfo?.episodes_names) return []

    const [start, end] = currentPageRange.split('-').map(Number)
    const episodes = detail.videoInfo.episodes_names
    const totalEpisodes = episodes.length

    if (isReversed) {
      const selectedEpisodes: { name: string; displayIndex: number; actualIndex: number }[] = []
      for (let i = start; i <= end; i++) {
        const actualIndex = totalEpisodes - 1 - i
        if (actualIndex >= 0 && actualIndex < totalEpisodes) {
          selectedEpisodes.push({ name: episodes[actualIndex], displayIndex: i, actualIndex })
        }
      }
      return selectedEpisodes
    }

    return episodes.slice(start, end + 1).map((name, idx) => ({
      name,
      displayIndex: start + idx,
      actualIndex: start + idx,
    }))
  }, [currentPageRange, detail?.videoInfo?.episodes_names, isReversed])

  useEffect(() => {
    const fetchDetail = async () => {
      if (!sourceCode || !vodId) return

      setLoading(true)
      try {
        const api = videoAPIs.find(item => item.id === sourceCode)
        if (!api) throw new Error('未找到对应的API配置')

        const response = await apiService.getVideoDetail(vodId, api)
        setDetail(response)
      } catch (error) {
        console.error('获取视频详情失败:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDetail()
  }, [sourceCode, vodId, videoAPIs])

  useEffect(() => {
    if (pageRanges.length === 0) return
    setCurrentPageRange(pageRanges[0].value)
  }, [pageRanges, isReversed])

  const handlePlayEpisode = (displayIndex: number) => {
    const actualIndex = isReversed
      ? (detail?.videoInfo?.episodes_names?.length || 0) - 1 - displayIndex
      : displayIndex
    navigate(`/video/${sourceCode}/${vodId}/${actualIndex}`)
  }

  if (loading) {
    const loadingHint = (
      <div className="flex items-center gap-2 text-sm text-muted-fg">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand/25 border-t-brand" />
        正在加载详情…
      </div>
    )

    // 没有已知信息（直接打开链接）时给一版有边框、能看出在加载的骨架
    if (!title) {
      return (
        <div className="pt-8">
          <div className="flex flex-col gap-6 md:flex-row">
            <div className="mx-auto aspect-[2/3] w-40 animate-pulse rounded-xl border border-line bg-surface md:mx-0 md:w-56" />
            <div className="flex-1 space-y-3">
              <div className="h-7 w-2/3 animate-pulse rounded bg-surface" />
              <div className="h-4 w-1/3 animate-pulse rounded bg-surface" />
              <div className="h-24 w-full animate-pulse rounded bg-surface" />
            </div>
          </div>
          <div className="mt-8">{loadingHint}</div>
        </div>
      )
    }

    return (
      <div className="flex flex-col gap-6 pt-8 md:flex-row">
        <div className="mx-auto w-40 shrink-0 md:mx-0 md:w-56">
          <div className="aspect-[2/3] overflow-hidden rounded-xl border border-line bg-surface">
            <img
              alt={title}
              className="h-full w-full object-cover opacity-80"
              src={getProxiedImageUrl(cover) || getPlaceholderImageUrl('加载中')}
              onError={e => handleImageError(e, title)}
            />
          </div>
        </div>
        <div className="flex-1 space-y-3">
          <h1 className="text-2xl font-bold text-fg md:text-3xl">{title}</h1>
          {preview?.source_name ? (
            <p className="text-sm text-muted-fg">来源：{preview.source_name}</p>
          ) : null}
          {preview?.vod_remarks ? (
            <p className="text-sm text-muted-fg">{preview.vod_remarks}</p>
          ) : null}
          <div className="pt-2">{loadingHint}</div>
          <div className="space-y-2 pt-4">
            <div className="h-4 w-full animate-pulse rounded bg-surface" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-surface" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-surface" />
          </div>
        </div>
      </div>
    )
  }

  if (!detail || detail.code !== 200) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <p className="text-base font-medium text-fg">获取视频详情失败</p>
        <p className="text-sm text-muted-fg">可能是视频源暂时不可用，换一个源再试试。</p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mt-2 rounded-full border border-line px-4 py-2 text-sm text-fg-soft transition hover:text-fg"
        >
          返回上一页
        </button>
      </div>
    )
  }

  const meta = [
    sourceName && { label: '来源', value: sourceName },
    year && { label: '年份', value: year },
    type && { label: '类型', value: type },
    area && { label: '地区', value: area },
    remarks && { label: '状态', value: remarks },
  ].filter(Boolean) as { label: string; value: string }[]

  return (
    <div className="pt-5 pb-16">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm text-fg-soft transition hover:border-line-strong hover:text-fg"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m15 18-6-6 6-6" />
        </svg>
        返回
      </button>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-6 md:flex-row"
      >
        <div className="mx-auto w-40 shrink-0 md:mx-0 md:w-52">
          <div className="overflow-hidden rounded-xl border border-line bg-surface-2 shadow-[var(--shadow-card)]">
            <img
              alt={title}
              className="aspect-[2/3] w-full object-cover"
              src={getProxiedImageUrl(cover) || getPlaceholderImageUrl('暂无封面')}
              data-original-url={cover}
              onError={e => handleImageError(e, title)}
            />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold tracking-tight text-fg sm:text-2xl">{title}</h1>

          <div className="mt-3 flex flex-wrap gap-2">
            {meta.map(item => (
              <span
                key={item.label}
                className="rounded-md border border-line bg-surface-2 px-2 py-1 text-xs text-fg-soft"
              >
                <span className="text-muted-fg">{item.label}</span>
                <span className="ml-1.5 text-fg">{item.value}</span>
              </span>
            ))}
          </div>

          {director || actor ? (
            <div className="mt-4 space-y-1 text-sm text-muted-fg">
              {director ? (
                <p className="line-clamp-2">
                  <span className="text-fg-soft">导演：</span>
                  {director}
                </p>
              ) : null}
              {actor ? (
                <p className="line-clamp-2">
                  <span className="text-fg-soft">演员：</span>
                  {actor}
                </p>
              ) : null}
            </div>
          ) : null}

          {content ? (
            <p className="mt-4 line-clamp-4 text-sm leading-relaxed whitespace-pre-line text-muted-fg">
              {htmlToText(content)}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => navigate(`/video/${sourceCode}/${vodId}/0`)}
              className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_-12px_var(--brand)] transition hover:opacity-90"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
              立即播放
            </button>
            {detail.videoInfo?.episodes_names?.length ? (
              <span className="inline-flex items-center rounded-full border border-line px-4 py-2.5 text-sm text-fg-soft">
                共 {detail.videoInfo.episodes_names.length} 集
              </span>
            ) : null}
          </div>
        </div>
      </motion.div>

      {detail.videoInfo?.episodes_names?.length ? (
        <section className="mt-10">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="h-5 w-1 rounded-full bg-brand" />
              <h2 className="text-lg font-semibold text-fg">选集</h2>
              <span className="text-xs text-muted-fg">
                共 {detail.videoInfo.episodes_names.length} 集
              </span>
            </div>

            <div className="flex items-center gap-2">
              {pageRanges.length > 1 ? (
                <select
                  value={currentPageRange}
                  onChange={event => setCurrentPageRange(event.target.value)}
                  className="h-8 rounded-lg border border-line bg-surface-2 px-2 text-xs text-fg outline-none"
                  aria-label="选择集数范围"
                >
                  {pageRanges.map(range => (
                    <option key={range.value} value={range.value}>
                      {range.label}
                    </option>
                  ))}
                </select>
              ) : null}

              <button
                type="button"
                onClick={() => setIsReversed(prev => !prev)}
                className="flex h-8 items-center gap-1.5 rounded-lg border border-line px-2.5 text-xs text-fg-soft transition hover:text-fg"
              >
                {isReversed ? '倒序' : '正序'}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M7 4v16M7 20l-3-3M7 20l3-3M17 20V4M17 4l3 3M17 4l-3 3" />
                </svg>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
            {currentPageEpisodes.map(({ name, displayIndex }) => (
              <button
                key={`${name}-${displayIndex}`}
                type="button"
                title={name}
                onClick={() => handlePlayEpisode(displayIndex)}
                className={cn(
                  'flex h-10 items-center justify-center rounded-lg border border-line bg-surface px-2 text-xs text-fg-soft transition',
                  'hover:border-brand/50 hover:bg-brand-soft hover:text-brand',
                )}
              >
                <span className="truncate">{name || `第${displayIndex + 1}集`}</span>
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
