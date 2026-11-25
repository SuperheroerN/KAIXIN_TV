// API 配置
export const API_CONFIG = {
  search: {
    path: '/api.php/provide/vod/?ac=videolist&wd=',
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      Accept: 'application/json',
    },
  },
  detail: {
    path: '/api.php/provide/vod/?ac=videolist&ids=',
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      Accept: 'application/json',
    },
  },
}

// 其他配置
// 统一使用内置代理
export const PROXY_URL = '/proxy?url='
export const M3U8_PATTERN = /\$https?:\/\/[^"'\s]+?\.m3u8/g

import type { VideoApi } from '@/types/video'
import { INITIAL_CONFIG } from './initialConfig'
import { log } from '@/utils/logger'
import { DEFAULT_SETTINGS } from './settings.config'
import { parseSourceConfig, parseSourceList } from '@/services/sourceConfigParser'

const sourceParseOptions = () => ({
  timeout: DEFAULT_SETTINGS.network.defaultTimeout,
  retry: DEFAULT_SETTINGS.network.defaultRetry,
})

const isConfigured = (): boolean =>
  Boolean(INITIAL_CONFIG?.videoSources?.length) ||
  Boolean(String(import.meta.env.VITE_INITIAL_VIDEO_SOURCES ?? '').trim())

// 从环境变量获取初始视频源
const loadInitialVideoSources = async (): Promise<VideoApi[]> => {
  log('🔍 [环境变量检查] 开始读取视频源配置...')

  // 1. First priority: Full JSON config from VITE_INITIAL_CONFIG
  if (INITIAL_CONFIG?.videoSources && Array.isArray(INITIAL_CONFIG.videoSources)) {
    const sources = parseSourceList(INITIAL_CONFIG.videoSources, sourceParseOptions())
    log('✅ [环境变量检查] 从 VITE_INITIAL_CONFIG 读取到视频源:', sources)
    return sources
  }

  // 2. Second priority: Specific VITE_INITIAL_VIDEO_SOURCES
  const configured = import.meta.env.VITE_INITIAL_VIDEO_SOURCES
  log('🔍 [环境变量检查] VITE_INITIAL_VIDEO_SOURCES =', configured)

  if (!configured || typeof configured !== 'string' || !configured.trim()) {
    log('⚠️ [环境变量检查] 未配置 VITE_INITIAL_VIDEO_SOURCES 或格式不正确')
    return []
  }

  let envSources = configured
  try {
    new URL(envSources.trim())
    const response = await fetch(PROXY_URL + envSources.trim())
    if (!response.ok) {
      console.error(`无法获取视频源，HTTP状态: ${response.status}`)
      return []
    }
    envSources = await response.text()
  } catch {
    // 不是URL，继续处理
  }

  const result = parseSourceConfig(envSources, sourceParseOptions())

  if (result.error) {
    console.error('❌ [环境变量检查] 解析环境变量中的视频源失败:', result.error)
    console.error('❌ [环境变量检查] 环境变量内容:', envSources)
    return []
  }

  if (result.sources.length === 0) {
    console.error('❌ [环境变量检查] 环境变量中没有可用的视频源（需要 名称|https://... 或 JSON 数组）')
    console.error('❌ [环境变量检查] 环境变量内容:', envSources)
    return []
  }

  const formatLabel = result.format === 'json' ? 'JSON格式' : '简单格式'
  log(`✅ 成功加载视频源配置 (${formatLabel}):`, result.sources.length, '个源')
  return result.sources
}

// 环境变量里是否配置了源：用来判断残留的 env_source_* 该不该清掉
export const hasInitialSourceConfig = isConfigured

// 按 VITE_SOURCE_ORDER 给源排序权重：写源名称（或 id），逗号分隔，越靠前越优先
const applySourcePriority = (sources: VideoApi[]): VideoApi[] => {
  const order = String(import.meta.env.VITE_SOURCE_ORDER ?? '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)

  if (order.length === 0) return sources

  return sources.map((source, index) => {
    const nameIndex = order.indexOf(source.name)
    const position = nameIndex !== -1 ? nameIndex : order.indexOf(source.id)
    return {
      ...source,
      priority: position === -1 ? order.length + index : position,
    }
  })
}

export const getInitialVideoSources = async (): Promise<VideoApi[]> =>
  applySourcePriority(await loadInitialVideoSources())
