/**
 * 豆瓣API服务
 * 用于获取电影/电视剧推荐和分类数据
 */

// 豆瓣API基础URL
const DOUBAN_BASE_URL = 'https://movie.douban.com'

// 代理URL（用于解决CORS问题）
const PROXY_URL = '/proxy?url='

// 备用代理
const FALLBACK_PROXY = 'https://api.allorigins.win/get?url='

/**
 * 豆瓣内容类型
 */
export type DoubanType = 'movie' | 'tv'

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

/**
 * 通用请求处理函数
 */
async function fetchDoubanData<T>(url: string, timeout = 10000): Promise<T | null> {
  console.log('🎬 [豆瓣API] 请求URL:', url)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    // 尝试主代理
    const proxyUrl = `${PROXY_URL}${encodeURIComponent(url)}`
    console.log('   使用代理:', proxyUrl)

    const response = await fetch(proxyUrl, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()
    console.log('✅ [豆瓣API] 请求成功')
    return data as T
  } catch (error) {
    clearTimeout(timeoutId)
    console.error('❌ [豆瓣API] 请求失败:', error)

    // 尝试备用代理
    try {
      console.log('   尝试备用代理...')
      const fallbackUrl = `${FALLBACK_PROXY}${encodeURIComponent(url)}`
      const response = await fetch(fallbackUrl)
      const data = await response.json()

      if (data.contents) {
        const parsed = JSON.parse(data.contents)
        console.log('✅ [豆瓣API] 备用代理成功')
        return parsed as T
      }
    } catch (fallbackError) {
      console.error('❌ [豆瓣API] 备用代理也失败:', fallbackError)
    }

    return null
  }
}

/**
 * 获取豆瓣推荐内容
 * @param type 内容类型 movie 或 tv
 * @param tag 标签（如"热门"、"最新"等）
 * @param pageLimit 每页数量
 * @param pageStart 起始位置
 */
export async function fetchDoubanRecommend(
  type: DoubanType,
  tag: string = '热门',
  pageLimit: number = 20,
  pageStart: number = 0,
): Promise<DoubanItem[]> {
  const url = `${DOUBAN_BASE_URL}/j/search_subjects?type=${type}&tag=${encodeURIComponent(
    tag,
  )}&sort=recommend&page_limit=${pageLimit}&page_start=${pageStart}`

  const data = await fetchDoubanData<{ subjects: DoubanItem[] }>(url)

  if (data && data.subjects) {
    console.log(`📦 [豆瓣API] 获取到 ${data.subjects.length} 个${type === 'movie' ? '电影' : '电视剧'}`)
    return data.subjects
  }

  return []
}

/**
 * 获取豆瓣标签列表
 * @param type 内容类型 movie 或 tv
 */
export async function fetchDoubanTags(type: DoubanType): Promise<DoubanTag[]> {
  const url = `${DOUBAN_BASE_URL}/j/search_tags?type=${type}`

  const data = await fetchDoubanData<{ tags: string[] }>(url)

  if (data && data.tags) {
    console.log(`🏷️ [豆瓣API] 获取到 ${data.tags.length} 个标签`)
    return data.tags.map(tag => ({ name: tag }))
  }

  return []
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
