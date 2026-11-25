/**
 * 首页推荐数据
 * 优先使用豆瓣推荐；豆瓣不可用时回退到已配置视频源的最新更新，
 * 保证首页不会因为单个上游接口失败而整页变成"暂无内容"
 */
import type { VideoApi, VideoItem } from '@/types'
import {
  DOUBAN_CATEGORIES,
  getCategorySort,
  getDoubanRecommend,
  type DoubanItem,
} from './douban.service'

const PROXY_URL = '/proxy?url='

// 单个视频源列表请求超时
const SOURCE_TIMEOUT = 8000

// 等待多个源返回的总预算，超时的源直接跳过
const SOURCE_BUDGET = 5000

// 视频源列表缓存时间
const SOURCE_CACHE_TTL = 5 * 60 * 1000

// 回退时最多同时查询几个源
const MAX_FALLBACK_SOURCES = 8

// 回退列表最多展示多少条，和豆瓣一致
const MAX_FALLBACK_ITEMS = 20

const SOURCE_NOTE = '豆瓣接口暂时不可用，当前显示的是视频源的最新更新'
const CACHE_NOTE = '豆瓣接口暂时不可用，当前显示的是缓存内容'

export type HomeFeedSource = 'douban' | 'sources' | 'none'

export interface FeedItem {
  key: string
  title: string
  cover: string
  // 豆瓣评分
  rate?: string
  // 视频源备注（更新集数等）
  remarks?: string
  // 站内详情页地址，没有时点击按标题搜索
  href?: string
}

export interface HomeFeed {
  items: FeedItem[]
  source: HomeFeedSource
  note?: string
}

let sourceCache: { key: string; items: FeedItem[]; ts: number } | null = null

function toFeedItem(item: DoubanItem, index: number): FeedItem {
  return {
    key: `douban:${item.id || index}`,
    title: item.title,
    cover: item.cover,
    rate: item.rate,
  }
}

function buildListUrl(baseUrl: string): string {
  const url = baseUrl.trim().replace(/\/+$/, '')
  if (!url) return ''
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}ac=videolist&pg=1`
}

async function fetchSourceList(api: VideoApi): Promise<FeedItem[]> {
  const apiUrl = buildListUrl(api.url)
  if (!apiUrl) return []

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), SOURCE_TIMEOUT)

  try {
    const response = await fetch(`${PROXY_URL}${encodeURIComponent(apiUrl)}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = (await response.json()) as { list?: VideoItem[] }
    const list = Array.isArray(data?.list) ? data.list : []

    return list
      .filter(item => item?.vod_id && item?.vod_name)
      .map(item => ({
        key: `${api.id}:${item.vod_id}`,
        title: item.vod_name,
        cover: item.vod_pic || '',
        remarks: item.vod_remarks,
        href: `/detail/${api.id}/${item.vod_id}`,
      }))
  } catch {
    console.warn(`⚠️ [首页推荐] 视频源「${api.name}」最新列表获取失败`)
    return []
  } finally {
    clearTimeout(timeoutId)
  }
}

function withBudget<T>(promise: Promise<T>, fallback: T, ms: number): Promise<T> {
  return new Promise(resolve => {
    const timer = setTimeout(() => resolve(fallback), ms)
    promise.then(
      value => {
        clearTimeout(timer)
        resolve(value)
      },
      () => {
        clearTimeout(timer)
        resolve(fallback)
      },
    )
  })
}

/**
 * 从已启用的视频源拉取最新更新，多个源轮流穿插展示
 */
async function fetchSourceLatest(sources: VideoApi[]): Promise<FeedItem[]> {
  const enabled = sources
    .filter(source => source.isEnabled && source.url)
    .slice(0, MAX_FALLBACK_SOURCES)

  if (enabled.length === 0) return []

  const cacheKey = enabled.map(source => source.id).join(',')
  if (
    sourceCache &&
    sourceCache.key === cacheKey &&
    Date.now() - sourceCache.ts < SOURCE_CACHE_TTL
  ) {
    return sourceCache.items
  }

  const lists = (
    await Promise.all(enabled.map(source => withBudget(fetchSourceList(source), [], SOURCE_BUDGET)))
  ).filter(items => items.length > 0)

  if (lists.length === 0) return []

  const merged: FeedItem[] = []
  const seen = new Set<string>()

  const addItem = (item: FeedItem): boolean => {
    const title = item.title.trim()
    if (!title || seen.has(title) || merged.length >= MAX_FALLBACK_ITEMS) return false

    seen.add(title)
    merged.push(item)
    return true
  }

  // 先按均分额度取，保证每个源都能出现在首页
  const quota = Math.max(1, Math.floor(MAX_FALLBACK_ITEMS / lists.length))
  for (const items of lists) {
    let taken = 0
    for (const item of items) {
      if (taken >= quota) break
      if (addItem(item)) taken++
    }
  }

  // 再用各源的新条目补齐剩余位置
  const longest = Math.max(...lists.map(items => items.length))
  for (let index = quota; index < longest && merged.length < MAX_FALLBACK_ITEMS; index++) {
    for (const items of lists) {
      const item = items[index]
      if (item) addItem(item)
      if (merged.length >= MAX_FALLBACK_ITEMS) break
    }
  }

  sourceCache = { key: cacheKey, items: merged, ts: Date.now() }
  return merged
}

/**
 * 加载首页分类内容
 */
export async function loadHomeFeed(categoryKey: string, sources: VideoApi[]): Promise<HomeFeed> {
  const category = DOUBAN_CATEGORIES.find(item => item.key === categoryKey)

  if (category) {
    const result = await getDoubanRecommend(
      category.type,
      category.tag,
      getCategorySort(category.key),
    )
    if (result.items.length > 0) {
      return {
        items: result.items.map(toFeedItem),
        source: 'douban',
        note: result.stale ? CACHE_NOTE : undefined,
      }
    }
  }

  const fallback = await fetchSourceLatest(sources)
  if (fallback.length > 0) {
    return { items: fallback, source: 'sources', note: SOURCE_NOTE }
  }

  return { items: [], source: 'none' }
}
