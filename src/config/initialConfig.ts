interface SettingsConfig {
  network?: {
    defaultTimeout?: number
    defaultRetry?: number
  }
  search?: {
    isSearchHistoryEnabled?: boolean
    isSearchHistoryVisible?: boolean
    searchCacheExpiryHours?: number
  }
  playback?: {
    isViewingHistoryEnabled?: boolean
    isViewingHistoryVisible?: boolean
    isAutoPlayEnabled?: boolean
    defaultEpisodeOrder?: 'asc' | 'desc'
    adFilteringEnabled?: boolean
  }
  system?: {
    isUpdateLogEnabled?: boolean
  }
}

interface VideoSourceConfig {
  id?: string
  name: string
  url: string
  detailUrl?: string
  isEnabled?: boolean
  updatedAt?: string | Date
  timeout?: number
  retry?: number
}

interface MetaConfig {
  version: string
  exportDate: string
}

interface ExportedConfig {
  settings?: SettingsConfig
  videoSources?: VideoSourceConfig[]
  meta?: MetaConfig
}

export const getInitialConfig = (): ExportedConfig | null => {
  const envConfig = import.meta.env.VITE_INITIAL_CONFIG
  if (!envConfig || typeof envConfig !== 'string') return null

  try {
    // Remove potential surrounding quotes added by .env parsers or users
    const cleanedConfig = envConfig.trim().replace(/^['"](.*)['"]$/, '$1')
    const parsed = JSON.parse(cleanedConfig)
    return parsed
  } catch (e) {
    console.error('Failed to parse VITE_INITIAL_CONFIG:', e)
    return null
  }
}

// 获取初始视频源配置
export const getInitialVideoSources = (): VideoSourceConfig[] => {
  const envSources = import.meta.env.VITE_INITIAL_VIDEO_SOURCES
  
  // 如果没有环境变量，返回空数组
  if (!envSources || typeof envSources !== 'string') {
    console.warn('⚠️ 未配置 VITE_INITIAL_VIDEO_SOURCES 环境变量')
    return []
  }

  try {
    // 方式1: 尝试解析 JSON 格式
    const cleanedConfig = envSources.trim().replace(/^['"](.*)['"]$/, '$1')
    const parsed = JSON.parse(cleanedConfig)
    
    if (Array.isArray(parsed) && parsed.length > 0) {
      console.log('✅ 成功加载视频源配置 (JSON格式):', parsed.length, '个源')
      return parsed
    }
  } catch (e) {
    // JSON 解析失败，尝试简单格式
    console.log('尝试使用简单格式解析...')
  }

  try {
    // 方式2: 简单格式 "名称1|URL1,名称2|URL2"
    const sources = envSources.split(',').map(item => {
      const [name, url] = item.trim().split('|')
      if (name && url) {
        return {
          name: name.trim(),
          url: url.trim(),
          isEnabled: true
        }
      }
      return null
    }).filter(Boolean) as VideoSourceConfig[]
    
    if (sources.length > 0) {
      console.log('✅ 成功加载视频源配置 (简单格式):', sources.length, '个源')
      return sources
    }
  } catch (e) {
    console.error('❌ 解析视频源配置失败:', e)
  }

  console.error('❌ 视频源配置格式错误，请检查环境变量')
  return []
}

export const INITIAL_CONFIG = getInitialConfig()
export const INITIAL_VIDEO_SOURCES = getInitialVideoSources()
