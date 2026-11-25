import { useEffect, useRef, useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router'
import Artplayer from 'artplayer'
import Hls, {
  type LoaderContext,
  type LoaderCallbacks,
  type LoaderResponse,
  type LoaderStats,
  type HlsConfig,
  type LoaderConfiguration,
} from 'hls.js'
import type { DetailResponse } from '@/types'
import { apiService } from '@/services/api.service'
import { useApiStore } from '@/store/apiStore'
import { useViewingHistoryStore } from '@/store/viewingHistoryStore'
import { useSettingStore } from '@/store/settingStore'
import { useDocumentTitle } from '@/hooks'
import _ from 'lodash'
import { toast } from 'sonner'
import { getProxiedImageUrl } from '@/utils/imageProxy'

// 过滤可疑的广告内容
function filterAdsFromM3U8(m3u8Content: string) {
  if (!m3u8Content) return ''

  // 按行分割M3U8内容
  const lines = m3u8Content.split('\n')
  const filteredLines = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // 只过滤#EXT-X-DISCONTINUITY标识
    if (!line.includes('#EXT-X-DISCONTINUITY')) {
      filteredLines.push(line)
    }
  }

  return filteredLines.join('\n')
}

// 扩展 LoaderContext 类型以包含 type 属性
interface ExtendedLoaderContext extends LoaderContext {
  type: string
}

// 扩展 Artplayer 类型以包含 hls 属性
interface ArtplayerWithHls extends Artplayer {
  hls?: Hls
}

// 自定义M3U8 Loader用于过滤广告
class CustomHlsJsLoader extends Hls.DefaultConfig.loader {
  constructor(config: HlsConfig) {
    super(config)
    const load = this.load.bind(this)
    this.load = function (
      context: LoaderContext,
      config: LoaderConfiguration,
      callbacks: LoaderCallbacks<LoaderContext>,
    ) {
      // 拦截manifest和level请求
      const ctx = context as ExtendedLoaderContext
      if (ctx.type === 'manifest' || ctx.type === 'level') {
        const onSuccess = callbacks.onSuccess
        callbacks.onSuccess = function (
          response: LoaderResponse,
          stats: LoaderStats,
          context: LoaderContext,
          networkDetails: unknown,
        ) {
          // 如果是m3u8文件，处理内容以移除广告分段
          if (response.data && typeof response.data === 'string') {
            // 过滤掉广告段 - 实现更精确的广告过滤逻辑
            response.data = filterAdsFromM3U8(response.data)
          }
          return onSuccess(response, stats, context, networkDetails)
        }
      }
      // 执行原始load方法
      load(context, config, callbacks)
    }
  }
}

export default function Video() {
  const navigate = useNavigate()
  const { sourceCode, vodId, episodeIndex } = useParams<{
    sourceCode: string
    vodId: string
    episodeIndex: string
  }>()

  const playerRef = useRef<Artplayer | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // 从 store 获取 API 配置
  const { videoAPIs, adFilteringEnabled } = useApiStore()
  const { addViewingHistory, viewingHistory } = useViewingHistoryStore()
  const { playback } = useSettingStore()

  // Use refs to access latest values in main useEffect without triggering re-renders
  const viewingHistoryRef = useRef(viewingHistory)
  const playbackRef = useRef(playback)

  useEffect(() => {
    viewingHistoryRef.current = viewingHistory
    playbackRef.current = playback
  }, [viewingHistory, playback])

  // 状态管理
  const [detail, setDetail] = useState<DetailResponse | null>(null)
  const [selectedEpisode, setSelectedEpisode] = useState(() => {
    const index = parseInt(episodeIndex || '0')
    return isNaN(index) ? 0 : index
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isReversed, setIsReversed] = useState(playback.defaultEpisodeOrder === 'desc')
  const [currentPageRange, setCurrentPageRange] = useState<string>('')
  const [episodesPerPage, setEpisodesPerPage] = useState(100)

  // 计算响应式的每页集数 (基于屏幕尺寸和列数)
  useEffect(() => {
    const calculateEpisodesPerPage = () => {
      const width = window.innerWidth
      let cols = 2 // 手机默认2列
      let rows = 8 // 默认行数

      if (width >= 1024) {
        cols = 8 // 桌面端8列
        rows = 5 // 桌面端行数，确保一屏显示完整
      } else if (width >= 768) {
        cols = 6 // 平板横屏6列
        rows = 6 // 平板行数
      } else if (width >= 640) {
        cols = 3 // 平板竖屏3列
        rows = 8
      }

      setEpisodesPerPage(cols * rows)
    }

    calculateEpisodesPerPage()
    window.addEventListener('resize', calculateEpisodesPerPage)
    return () => window.removeEventListener('resize', calculateEpisodesPerPage)
  }, [])

  // 获取显示信息
  const getTitle = () => detail?.videoInfo?.title || '未知视频'
  const sourceName = detail?.videoInfo?.source_name || '未知来源'

  // 动态更新页面标题
  const pageTitle = useMemo(() => {
    const title = detail?.videoInfo?.title
    if (title) {
      return `${title}`
    }
    return '视频播放'
  }, [detail?.videoInfo?.title])

  useDocumentTitle(pageTitle)

  // 获取视频详情
  useEffect(() => {
    const fetchVideoDetail = async () => {
      if (!sourceCode || !vodId) {
        setError('缺少必要的参数')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        // 根据 sourceCode 找到对应的 API 配置
        const api = videoAPIs.find(api => api.id === sourceCode)
        if (!api) {
          throw new Error('未找到对应的API配置')
        }

        // 获取视频详情
        const response = await apiService.getVideoDetail(vodId, api)

        if (response.code === 200 && response.episodes && response.episodes.length > 0) {
          setDetail(response)
        } else {
          throw new Error(response.msg || '获取视频详情失败')
        }
      } catch (err) {
        console.error('获取视频详情失败:', err)
        setError(err instanceof Error ? err.message : '获取视频详情失败')
      } finally {
        setLoading(false)
      }
    }

    fetchVideoDetail()
  }, [sourceCode, vodId, videoAPIs])

  // 监听 selectedEpisode 和 URL 参数变化
  useEffect(() => {
    const urlEpisodeIndex = parseInt(episodeIndex || '0')
    if (!isNaN(urlEpisodeIndex) && urlEpisodeIndex !== selectedEpisode) {
      setSelectedEpisode(urlEpisodeIndex)
    }
  }, [episodeIndex, selectedEpisode])

  useEffect(() => {
    if (!detail?.episodes || !detail.episodes[selectedEpisode] || !containerRef.current) return

    // 销毁旧的播放器实例
    if (playerRef.current && playerRef.current.destroy) {
      playerRef.current.destroy(false)
    }

    const nextEpisode = () => {
      if (!playbackRef.current.isAutoPlayEnabled) return

      const total = detail.videoInfo?.episodes_names?.length || 0
      if (selectedEpisode < total - 1) {
        const nextIndex = selectedEpisode + 1
        setSelectedEpisode(nextIndex)
        navigate(`/video/${sourceCode}/${vodId}/${nextIndex}`, {
          replace: true,
        })
        toast.info(`即将播放下一集: ${detail.videoInfo?.episodes_names?.[nextIndex]}`)
      }
    }

    // 创建新的播放器实例
    const art = new Artplayer({
      container: containerRef.current,
      url: detail.episodes[selectedEpisode],
      // 用影片封面做播放前封面，避免直接暴露源站首帧里的贴片广告
      poster: getProxiedImageUrl(detail.videoInfo?.cover || '') || '',
      volume: 0.7,
      isLive: false,
      muted: false,
      autoplay: false,
      pip: true,
      autoSize: true,
      autoMini: true,
      screenshot: true,
      setting: true,
      loop: false,
      flip: true,
      playbackRate: true,
      aspectRatio: true,
      fullscreen: true,
      fullscreenWeb: true,
      subtitleOffset: true,
      miniProgressBar: true,
      mutex: true,
      backdrop: true,
      playsInline: true,
      // autoPlayback: true, // Removed to avoid duplicate resume logic with viewingHistoryStore
      airplay: true,
      theme: '#23ade5',
      lang: 'zh-cn',
      moreVideoAttr: {
        crossOrigin: 'anonymous',
      },
      customType: {
        m3u8: function (video: HTMLMediaElement, url: string, art: Artplayer) {
          const artWithHls = art as ArtplayerWithHls
          if (Hls.isSupported()) {
            if (artWithHls.hls) artWithHls.hls.destroy()
            const hlsConfig: Partial<HlsConfig> = adFilteringEnabled
              ? { loader: CustomHlsJsLoader as unknown as typeof Hls.DefaultConfig.loader }
              : {}
            const hls = new Hls(hlsConfig)
            hls.loadSource(url)
            hls.attachMedia(video)
            artWithHls.hls = hls
            art.on('destroy', () => hls.destroy())
          } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = url
          } else {
            art.notice.show = 'Unsupported playback format: m3u8'
          }
        },
      },
    })

    playerRef.current = art

    // 自动续播
    art.on('ready', () => {
      const existingHistory = viewingHistoryRef.current.find(
        item =>
          item.sourceCode === sourceCode &&
          item.vodId === vodId &&
          item.episodeIndex === selectedEpisode,
      )
      if (existingHistory && existingHistory.playbackPosition > 0) {
        art.seek = existingHistory.playbackPosition
        toast.success('已自动跳转到上次观看位置')
      }
    })

    // 记录观看历史
    const normalAddHistory = () => {
      if (!sourceCode || !vodId || !detail?.videoInfo) return
      addViewingHistory({
        title: detail.videoInfo.title || '未知视频',
        imageUrl: detail.videoInfo.cover || '',
        sourceCode: sourceCode || '',
        sourceName: detail.videoInfo.source_name || '',
        vodId: vodId || '',
        episodeIndex: selectedEpisode,
        episodeName: detail.videoInfo.episodes_names?.[selectedEpisode],
        playbackPosition: art.currentTime || 0,
        duration: art.duration || 0,
        timestamp: Date.now(),
      })
    }

    art.on('video:play', normalAddHistory)
    art.on('video:pause', normalAddHistory)
    art.on('video:ended', () => {
      normalAddHistory()
      nextEpisode()
    })
    art.on('video:error', normalAddHistory)

    let lastTimeUpdate = 0
    const TIME_UPDATE_INTERVAL = 3000

    const timeUpdateHandler = () => {
      if (!sourceCode || !vodId || !detail?.videoInfo) return
      const currentTime = art.currentTime || 0
      const duration = art.duration || 0
      const timeSinceLastUpdate = Date.now() - lastTimeUpdate

      if (timeSinceLastUpdate >= TIME_UPDATE_INTERVAL && currentTime > 0 && duration > 0) {
        lastTimeUpdate = Date.now()
        addViewingHistory({
          title: detail.videoInfo.title || '未知视频',
          imageUrl: detail.videoInfo.cover || '',
          sourceCode: sourceCode || '',
          sourceName: detail.videoInfo.source_name || '',
          vodId: vodId || '',
          episodeIndex: selectedEpisode,
          episodeName: detail.videoInfo.episodes_names?.[selectedEpisode],
          playbackPosition: currentTime,
          duration: duration,
          timestamp: Date.now(),
        })
      }
    }

    art.on('video:timeupdate', _.throttle(timeUpdateHandler, TIME_UPDATE_INTERVAL))

    // 清理函数
    return () => {
      if (playerRef.current && playerRef.current.destroy) {
        normalAddHistory()
        playerRef.current.destroy(false)
        playerRef.current = null
      }
    }
  }, [selectedEpisode, detail, sourceCode, vodId, addViewingHistory, navigate, adFilteringEnabled])

  // 处理集数切换
  const handleEpisodeChange = (displayIndex: number) => {
    // displayIndex 是在当前显示列表中的索引（已考虑倒序）
    // 需要转换成原始列表中的实际索引
    const actualIndex = isReversed
      ? (detail?.videoInfo?.episodes_names?.length || 0) - 1 - displayIndex
      : displayIndex
    setSelectedEpisode(actualIndex)
    // 更新 URL，保持路由同步
    navigate(`/video/${sourceCode}/${vodId}/${actualIndex}`, {
      replace: true,
    })
  }

  // 计算分页范围（根据正序倒序调整标签）
  const pageRanges = useMemo(() => {
    const totalEpisodes = detail?.videoInfo?.episodes_names?.length || 0
    if (totalEpisodes === 0) return []

    const ranges: { label: string; value: string; start: number; end: number }[] = []

    if (isReversed) {
      // 倒序：从最后一集开始
      for (let i = 0; i < totalEpisodes; i += episodesPerPage) {
        const start = i
        const end = Math.min(i + episodesPerPage - 1, totalEpisodes - 1)
        // 倒序时，标签应该显示从大到小
        const labelStart = totalEpisodes - start
        const labelEnd = totalEpisodes - end
        ranges.push({
          label: `${labelStart}-${labelEnd}`,
          value: `${start}-${end}`,
          start,
          end,
        })
      }
    } else {
      // 正序：从第一集开始
      for (let i = 0; i < totalEpisodes; i += episodesPerPage) {
        const start = i
        const end = Math.min(i + episodesPerPage - 1, totalEpisodes - 1)
        ranges.push({
          label: `${start + 1}-${end + 1}`,
          value: `${start}-${end}`,
          start,
          end,
        })
      }
    }

    return ranges
  }, [detail?.videoInfo?.episodes_names?.length, episodesPerPage, isReversed])

  // 初始化当前页范围 & 当切换正序倒序时自动调整页码
  useEffect(() => {
    if (pageRanges.length === 0 || !detail?.videoInfo?.episodes_names) return

    const totalEpisodes = detail.videoInfo.episodes_names.length
    const actualSelectedIndex = selectedEpisode

    // 根据实际索引计算显示索引
    const displayIndex = isReversed ? totalEpisodes - 1 - actualSelectedIndex : actualSelectedIndex

    // 找到包含当前选集的页范围
    const rangeContainingSelected = pageRanges.find(
      range => displayIndex >= range.start && displayIndex <= range.end,
    )

    if (rangeContainingSelected) {
      setCurrentPageRange(rangeContainingSelected.value)
    } else {
      // 如果没有找到，设置为第一页
      setCurrentPageRange(pageRanges[0].value)
    }
  }, [pageRanges, selectedEpisode, isReversed, detail?.videoInfo?.episodes_names])

  // 当前页显示的剧集
  const currentPageEpisodes = useMemo(() => {
    if (!currentPageRange || !detail?.videoInfo?.episodes_names) return []

    const [start, end] = currentPageRange.split('-').map(Number)
    const totalEpisodes = detail.videoInfo.episodes_names.length
    const episodes = detail.videoInfo.episodes_names

    if (isReversed) {
      // 倒序：取出对应范围的集数并反转
      const selectedEpisodes = []
      for (let i = start; i <= end; i++) {
        const actualIndex = totalEpisodes - 1 - i
        if (actualIndex >= 0 && actualIndex < totalEpisodes) {
          selectedEpisodes.push({
            name: episodes[actualIndex],
            displayIndex: i,
            actualIndex: actualIndex,
          })
        }
      }
      return selectedEpisodes
    } else {
      // 正序：直接取出对应范围
      return episodes.slice(start, end + 1).map((name, idx) => ({
        name,
        displayIndex: start + idx,
        actualIndex: start + idx,
      }))
    }
  }, [currentPageRange, detail?.videoInfo?.episodes_names, isReversed])

  // 加载状态
  if (loading) {
    return (
      <div className="flex flex-col gap-4 pt-6">
        <div className="h-6 w-1/3 animate-pulse rounded bg-surface-2" />
        <div className="aspect-video w-full animate-pulse rounded-xl bg-surface-2" />
        <p className="text-center text-sm text-muted-fg">正在加载视频信息…</p>
      </div>
    )
  }

  // 错误状态
  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <p className="text-base font-medium text-fg">{error}</p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mt-2 rounded-full border border-line px-4 py-2 text-sm text-fg-soft transition hover:text-fg"
        >
          返回
        </button>
      </div>
    )
  }

  // 没有播放数据
  if (!detail || !detail.episodes || detail.episodes.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <p className="text-base font-medium text-fg">无法获取播放信息</p>
        <p className="text-sm text-muted-fg">这个源可能暂时不可用，回上一页换个源试试。</p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mt-2 rounded-full border border-line px-4 py-2 text-sm text-fg-soft transition hover:text-fg"
        >
          返回
        </button>
      </div>
    )
  }

  // 集数越界：给出明确提示，而不是渲染一个空白播放器
  if (selectedEpisode < 0 || selectedEpisode >= detail.episodes.length) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <p className="text-base font-medium text-fg">这一集不存在</p>
        <p className="text-sm text-muted-fg">
          链接请求的是第 {selectedEpisode + 1} 集，这个源当前只有 {detail.episodes.length} 集。
        </p>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => navigate(`/video/${sourceCode}/${vodId}/0`, { replace: true })}
            className="rounded-full border border-line px-4 py-2 text-sm text-fg-soft transition hover:border-line-strong hover:text-fg"
          >
            从第 1 集播放
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-full border border-line px-4 py-2 text-sm text-fg-soft transition hover:border-line-strong hover:text-fg"
          >
            返回
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl pt-5 pb-16">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted-fg">{sourceName}</p>
          <h1 className="mt-0.5 truncate text-lg font-semibold tracking-tight text-fg sm:text-xl">
            {getTitle()}
          </h1>
          <p className="mt-1 text-xs text-muted-fg">
            第 {selectedEpisode + 1} 集 · 共 {detail.episodes.length} 集
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm text-fg-soft transition hover:border-line-strong hover:text-fg"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" />
          </svg>
          返回
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-black shadow-[var(--shadow-card)]">
        <div id="player" ref={containerRef} className="aspect-video w-full" />
      </div>

      {detail.videoInfo?.episodes_names && detail.videoInfo.episodes_names.length > 0 ? (
        <section className="mt-6">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="h-5 w-1 rounded-full bg-brand" />
              <h2 className="text-lg font-semibold text-fg">选集</h2>
              <span className="text-xs text-muted-fg">共 {detail.videoInfo.episodes_names.length} 集</span>
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
                onClick={() => setIsReversed(!isReversed)}
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
            {currentPageEpisodes.map(({ name, displayIndex, actualIndex }) => {
              const active = selectedEpisode === actualIndex
              return (
                <button
                  key={`${name}-${displayIndex}`}
                  type="button"
                  title={name}
                  onClick={() => handleEpisodeChange(displayIndex)}
                  className={`flex h-10 items-center justify-center rounded-lg border px-2 text-xs transition ${
                    active
                      ? 'border-brand bg-brand font-semibold text-white'
                      : 'border-line bg-surface text-fg-soft hover:border-brand/50 hover:bg-brand-soft hover:text-brand'
                  }`}
                >
                  <span className="truncate">{name}</span>
                </button>
              )
            })}
          </div>
        </section>
      ) : null}
    </div>
  )
}
