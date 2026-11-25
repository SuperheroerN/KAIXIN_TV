import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { VideoApi } from '@/types'
import { getInitialVideoSources, hasInitialSourceConfig } from '@/config/api.config'
import { v4 as uuidv4 } from 'uuid'
import { useSettingStore } from './settingStore'

interface ApiState {
  // 自定义 API 列表
  videoAPIs: VideoApi[]
  // 广告过滤开关
  adFilteringEnabled: boolean
}

interface ApiActions {
  // 设置 API 启用状态
  setApiEnabled: (apiId: string, enabled: boolean) => void
  // 添加视频 API
  addAndUpdateVideoAPI: (api: VideoApi) => void
  // 删除视频 API
  removeVideoAPI: (apiId: string) => void
  // 设置广告过滤
  setAdFilteringEnabled: (enabled: boolean) => void
  // 全选 API
  selectAllAPIs: () => void
  // 取消全选
  deselectAllAPIs: () => void
  // 初始化环境变量中的视频源
  initializeEnvSources: () => void
  // 批量导入视频源
  importVideoAPIs: (apis: VideoApi[]) => void
  // 获取选中的视频源
  getSelectedAPIs: () => VideoApi[]
  // 重置视频源
  resetVideoSources: () => Promise<void>
}

type ApiStore = ApiState & ApiActions

export const useApiStore = create<ApiStore>()(
  devtools(
    persist(
      immer<ApiStore>((set, get) => ({
        videoAPIs: [],
        adFilteringEnabled: true,

        // Actions
        setApiEnabled: (apiId: string, enabled: boolean) => {
          set(state => {
            const api = state.videoAPIs.find(a => a.id === apiId)
            if (api) {
              api.isEnabled = enabled
            }
          })
        },

        addAndUpdateVideoAPI: (api: VideoApi) => {
          set(state => {
            const index = state.videoAPIs.findIndex(a => a.id === api.id)
            if (index !== -1) {
              state.videoAPIs[index] = { ...api, updatedAt: new Date() }
            } else {
              state.videoAPIs.push({ ...api, updatedAt: new Date() })
            }
          })
        },

        removeVideoAPI: (apiId: string) => {
          set(state => {
            state.videoAPIs = state.videoAPIs.filter(api => api.id !== apiId)
          })
        },

        setAdFilteringEnabled: (enabled: boolean) => {
          set(state => {
            state.adFilteringEnabled = enabled
          })
        },

        selectAllAPIs: () => {
          set(state => {
            state.videoAPIs = state.videoAPIs.map(api => ({ ...api, isEnabled: true }))
          })
        },

        deselectAllAPIs: () => {
          set(state => {
            state.videoAPIs = state.videoAPIs.map(api => ({ ...api, isEnabled: false }))
          })
        },

        initializeEnvSources: async () => {
          const envSources = await getInitialVideoSources()
          // 没配环境变量：保留用户自己维护的列表
          // 配了但一个源都解析不出来：说明配置有误，同样清掉上次残留的 env_source_*
          if (envSources.length === 0 && !hasInitialSourceConfig()) return

          set(state => {
            // 环境变量源始终以 .env 为准（增删都会同步），用户自己添加的源保留
            const envIds = new Set(envSources.map(source => source.id))
            const envUrls = new Set(envSources.map(source => source.url))
            const userSources = state.videoAPIs.filter(
              api =>
                !envIds.has(api.id) &&
                !api.id?.startsWith('env_source_') &&
                !envUrls.has(api.url),
            )

            state.videoAPIs = [...envSources, ...userSources]
          })
        },

        importVideoAPIs: (apis: VideoApi[]) => {
          set(state => {
            apis.forEach(api => {
              // 检查是否已存在相同的源（基于name和url）
              const exists = state.videoAPIs.some(
                existingApi =>
                  existingApi.id === api.id ||
                  (existingApi.name === api.name && existingApi.url === api.url),
              )
              if (!exists) {
                state.videoAPIs.push({
                  id: api.id || uuidv4(),
                  name: api.name,
                  url: api.url,
                  detailUrl: api.detailUrl || '',
                  timeout: api.timeout || useSettingStore.getState().network.defaultTimeout || 3000,
                  retry: api.retry || useSettingStore.getState().network.defaultRetry || 3,
                  isEnabled: api.isEnabled ?? true,
                  updatedAt: api.updatedAt || new Date(),
                })
              }
            })
          })
        },

        getSelectedAPIs: () => {
          return get().videoAPIs.filter(api => api.isEnabled)
        },

        resetVideoSources: async () => {
          set(state => {
            state.videoAPIs = []
          })
          await get().initializeEnvSources()
        },
      })),
      {
        name: 'ouonnki-tv-api-store',
        version: 7,
        partialize: (state) => ({
          adFilteringEnabled: state.adFilteringEnabled,
          videoAPIs: state.videoAPIs,
        }),
        migrate: (persistedState: unknown) => {
          const state = persistedState as Partial<ApiState> | undefined

          return {
            adFilteringEnabled: state?.adFilteringEnabled ?? true,
            videoAPIs: Array.isArray(state?.videoAPIs) ? state.videoAPIs : [],
          }
        },
      },
    ),
    {
      name: 'ApiStore',
    },
  ),
)
