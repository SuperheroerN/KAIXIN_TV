/**
 * 豆瓣API服务
 * 用于获取电影/电视剧推荐和分类数据
 */

// 豆瓣API基础URL
const DOUBAN_BASE_URL = 'https://movie.douban.com'

// 代理URL（用于解决CORS问题）
const PROXY_URL = '/proxy?url='

// 单次请求超时时间
const REQUEST_TIMEOUT = 6000

// 缓存有效期：30 分钟内直接命中，超过后作为兜底数据最多保留 24 小时
const CACHE_TTL = 30 * 60 * 1000
const CACHE_MAX_AGE = 24 * 60 * 60 * 1000

// 连续失败后的冷却时间，避免每次切换分类都白等一次超时
const FAILURE_COOLDOWN = 2 * 60 * 1000

const STORAGE_PREFIX = 'kaixin:douban:'

/**
 * 豆瓣内容类型
 */
export type DoubanType = 'movie' | 'tv'

/**
 * 豆瓣排序方式
 * recommend: 综合推荐  time: 最新  rank: 评分
 */
export type DoubanSort = 'recommend' | 'time' | 'rank'

/**
 * 豆瓣推荐项
 */
export interface DoubanItem {
  id: string
  title: string
  cover: string
  rate: string
  url: string
  cover_x?: number
  cover_y?: number
  is_new?: boolean
}

/**
 * 豆瓣标签
 */
export interface DoubanTag {
  name: string
  count?: number
}

export interface DoubanRecommendResult {
  items: DoubanItem[]
  // 数据来自过期缓存（豆瓣当前不可用）
  stale: boolean
}

interface CacheEntry {
  items: DoubanItem[]
  ts: number
}

const memoryCache = new Map<string, CacheEntry>()

// 豆瓣不可用时的冷却截止时间
let cooldownUntil = 0

/**
 * 是否禁用豆瓣数据源（服务器访问不了豆瓣时可在环境变量里关掉）
 */
export function isDoubanDisabled(): boolean {
  return import.meta.env.VITE_DISABLE_DOUBAN === 'true'
}

function buildCacheKey(
  type: DoubanType,
  tag: string,
  sort: DoubanSort,
  pageLimit: number,
  pageStart: number,
): string {
  return `${type}|${tag}|${sort}|${pageLimit}|${pageStart}`
}

function readCache(key: string): { entry: CacheEntry; fresh: boolean } | null {
  let entry = memoryCache.get(key)

  if (!entry) {
    try {
      const raw = sessionStorage.getItem(STORAGE_PREFIX + key)
      if (raw) entry = JSON.parse(raw) as CacheEntry
    } catch {
      entry = undefined
    }
    if (entry?.items?.length) memoryCache.set(key, entry)
  }

  if (!entry?.items?.length) return null

  const age = Date.now() - entry.ts
  if (age > CACHE_MAX_AGE) return null

  return { entry, fresh: age <= CACHE_TTL }
}

function writeCache(key: string, items: DoubanItem[]): void {
  const entry: CacheEntry = { items, ts: Date.now() }
  memoryCache.set(key, entry)
  try {
    sessionStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry))
  } catch {
    // sessionStorage 写满或被禁用时忽略，内存缓存仍然有效
  }
}

/**
 * 通用请求处理函数
 */
async function requestDouban<T>(url: string): Promise<T | null> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

  try {
    const response = await fetch(`${PROXY_URL}${encodeURIComponent(url)}`, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    return (await response.json()) as T
  } catch (error) {
    console.warn('❌ [豆瓣API] 请求失败:', url, error)
    cooldownUntil = Date.now() + FAILURE_COOLDOWN
    return null
  } finally {
    clearTimeout(timeoutId)
  }
}

function buildSearchUrl(
  type: DoubanType,
  tag: string,
  sort: DoubanSort,
  pageLimit: number,
  pageStart: number,
): string {
  return `${DOUBAN_BASE_URL}/j/search_subjects?type=${type}&tag=${encodeURIComponent(
    tag,
  )}&sort=${sort}&page_limit=${pageLimit}&page_start=${pageStart}`
}

async function requestSubjects(
  type: DoubanType,
  tag: string,
  sort: DoubanSort,
  pageLimit: number,
  pageStart: number,
): Promise<DoubanItem[] | null> {
  const data = await requestDouban<{ subjects?: DoubanItem[] }>(
    buildSearchUrl(type, tag, sort, pageLimit, pageStart),
  )
  return data ? (data.subjects ?? []) : null
}

/**
 * 获取豆瓣推荐内容
 * 优先走缓存；豆瓣不可用时返回过期缓存，避免页面直接变成"暂无内容"
 */
export async function getDoubanRecommend(
  type: DoubanType,
  tag: string,
  sort: DoubanSort = 'recommend',
  pageLimit: number = 20,
  pageStart: number = 0,
): Promise<DoubanRecommendResult> {
  const key = buildCacheKey(type, tag, sort, pageLimit, pageStart)
  const cached = readCache(key)

  if (isDoubanDisabled()) {
    return { items: [], stale: false }
  }

  if (cached?.fresh) {
    return { items: cached.entry.items, stale: false }
  }

  if (Date.now() < cooldownUntil) {
    return cached ? { items: cached.entry.items, stale: true } : { items: [], stale: false }
  }

  let items = await requestSubjects(type, tag, sort, pageLimit, pageStart)

  // 豆瓣部分标签在 recommend 排序下几乎没有数据，换用 time 再取一次
  if (items && items.length === 0 && sort !== 'time') {
    items = await requestSubjects(type, tag, 'time', pageLimit, pageStart)
  }

  if (items && items.length > 0) {
    writeCache(key, items)
    return { items, stale: false }
  }

  return cached ? { items: cached.entry.items, stale: true } : { items: [], stale: false }
}

/**
 * 获取豆瓣推荐内容（只要结果数组）
 */
export async function fetchDoubanRecommend(
  type: DoubanType,
  tag: string = '热门',
  pageLimit: number = 20,
  pageStart: number = 0,
): Promise<DoubanItem[]> {
  const result = await getDoubanRecommend(type, tag, 'recommend', pageLimit, pageStart)
  return result.items
}

/**
 * 获取豆瓣标签列表
 * @param type 内容类型 movie 或 tv
 */
export async function fetchDoubanTags(type: DoubanType): Promise<DoubanTag[]> {
  const data = await requestDouban<{ tags?: string[] }>(
    `${DOUBAN_BASE_URL}/j/search_tags?type=${type}`,
  )

  if (data?.tags) {
    return data.tags.map(tag => ({ name: tag }))
  }

  return []
}

/**
 * 分类使用的豆瓣排序方式
 * 未列出的分类统一用 recommend
 */
const CATEGORY_SORTS: Record<string, DoubanSort> = {
  latest: 'time',
  classic: 'rank',
  'high-score': 'rank',
}

export function getCategorySort(key: string): DoubanSort {
  return CATEGORY_SORTS[key] ?? 'recommend'
}

/**
 * 预定义的分类配置
 * 基于豆瓣API的标签系统
 */
export const DOUBAN_CATEGORIES = [
  // 综合推荐
  { key: 'hot', label: '热门', type: 'movie' as DoubanType, tag: '热门' },
  { key: 'latest', label: '最新', type: 'movie' as DoubanType, tag: '最新' },
  { key: 'classic', label: '经典', type: 'movie' as DoubanType, tag: '经典' },
  { key: 'high-score', label: '豆瓣高分', type: 'movie' as DoubanType, tag: '豆瓣高分' },
  { key: 'hidden-gem', label: '冷门佳片', type: 'movie' as DoubanType, tag: '冷门佳片' },

  // 电影类型
  { key: 'movie', label: '电影', type: 'movie' as DoubanType, tag: '热门' },
  { key: 'action', label: '动作', type: 'movie' as DoubanType, tag: '动作' },
  { key: 'comedy', label: '喜剧', type: 'movie' as DoubanType, tag: '喜剧' },
  { key: 'romance', label: '爱情', type: 'movie' as DoubanType, tag: '爱情' },
  { key: 'scifi', label: '科幻', type: 'movie' as DoubanType, tag: '科幻' },
  { key: 'suspense', label: '悬疑', type: 'movie' as DoubanType, tag: '悬疑' },
  { key: 'horror', label: '恐怖', type: 'movie' as DoubanType, tag: '恐怖' },
  { key: 'art', label: '文艺', type: 'movie' as DoubanType, tag: '文艺' },

  // 地区分类
  { key: 'chinese', label: '华语', type: 'movie' as DoubanType, tag: '华语' },
  { key: 'western', label: '欧美', type: 'movie' as DoubanType, tag: '欧美' },
  { key: 'korean', label: '韩国', type: 'movie' as DoubanType, tag: '韩国' },
  { key: 'japanese', label: '日本', type: 'movie' as DoubanType, tag: '日本' },

  // 电视剧
  { key: 'tv', label: '电视剧', type: 'tv' as DoubanType, tag: '热门' },
  { key: 'us-drama', label: '美剧', type: 'tv' as DoubanType, tag: '美剧' },
  { key: 'uk-drama', label: '英剧', type: 'tv' as DoubanType, tag: '英剧' },
  { key: 'kr-drama', label: '韩剧', type: 'tv' as DoubanType, tag: '韩剧' },
  { key: 'jp-drama', label: '日剧', type: 'tv' as DoubanType, tag: '日剧' },
  { key: 'cn-drama', label: '国产剧', type: 'tv' as DoubanType, tag: '国产剧' },
  { key: 'hk-drama', label: '港剧', type: 'tv' as DoubanType, tag: '港剧' },

  // 其他类型
  { key: 'anime', label: '日本动画', type: 'tv' as DoubanType, tag: '日本动画' },
  { key: 'variety', label: '综艺', type: 'tv' as DoubanType, tag: '综艺' },
  { key: 'documentary', label: '纪录片', type: 'tv' as DoubanType, tag: '纪录片' },
]
