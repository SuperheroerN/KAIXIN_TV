import { useParams, useNavigate } from 'react-router'
import { apiService } from '@/services/api.service'
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import type { VideoItem } from '@/types'
import { useApiStore } from '@/store/apiStore'
import { useSearchStore } from '@/store/searchStore'
import { PaginationConfig } from '@/config/video.config'
import { useDocumentTitle } from '@/hooks'
import { NoResultIcon } from '@/components/icons'
import { EmptyState, PosterCard, PosterGrid, SectionHeader } from '@/components/ui-kit'
import { toast } from 'sonner'

const PAGE_SIZE = PaginationConfig.singlePageSize

export default function SearchResult() {
  const abortCtrlRef = useRef<AbortController | null>(null)
  const videoAPIs = useApiStore(state => state.videoAPIs)
  const getCachedResults = useSearchStore(state => state.getCachedResults)
  const updateCachedResults = useSearchStore(state => state.updateCachedResults)
  const navigate = useNavigate()

  const { query } = useParams()
  const [searchRes, setSearchRes] = useState<VideoItem[]>([])
  const [curPage, setCurPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const timeOutTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const paginationRes = useMemo(() => {
    const res: VideoItem[][] = []
    for (let i = 0; i < searchRes.length; i += PAGE_SIZE) {
      res.push(searchRes.slice(i, Math.min(i + PAGE_SIZE, searchRes.length)))
    }
    return res
  }, [searchRes])

  const selectedAPIs = useMemo(() => videoAPIs.filter(api => api.isEnabled), [videoAPIs])

  const fetchSearchRes = useCallback(
    async (keyword: string | undefined) => {
      if (!keyword) return

      const searchAPIs = async (
        apisToSearch: typeof selectedAPIs,
        existingResults: VideoItem[],
        existingApiIds: string[],
      ) => {
        abortCtrlRef.current?.abort()
        const controller = new AbortController()
        abortCtrlRef.current = controller

        if (timeOutTimer.current) {
          clearTimeout(timeOutTimer.current)
          timeOutTimer.current = null
        }
        timeOutTimer.current = setTimeout(() => {
          setLoading(false)
          timeOutTimer.current = null
        }, PaginationConfig.maxRequestTimeout)

        const completedApiIds = [...existingApiIds]
        let hasNewResults = false

        const sourcePriorityMap = new Map<string, number>()
        selectedAPIs.forEach((api, index) => sourcePriorityMap.set(api.id, api.priority ?? index))

        toast.loading('正在搜索各个视频源…', { id: 'search-toast' })

        const searchPromise = apiService
          .aggregatedSearch(
            keyword,
            apisToSearch,
            newResults => {
              hasNewResults = true

              setSearchRes(prevResults => {
                const mergedRes = [...prevResults, ...newResults]
                mergedRes.sort((a, b) => {
                  const priorityA = sourcePriorityMap.get(a.source_code || '') ?? 999
                  const priorityB = sourcePriorityMap.get(b.source_code || '') ?? 999
                  return priorityA - priorityB
                })

                if (mergedRes.length >= PAGE_SIZE) setLoading(false)
                return mergedRes
              })

              const newApiIds = Array.from(
                new Set(newResults.map(r => r.source_code).filter((id): id is string => !!id)),
              )
              newApiIds.forEach(id => {
                if (!completedApiIds.includes(id)) completedApiIds.push(id)
              })

              updateCachedResults(keyword, newResults, completedApiIds, false)
            },
            controller.signal,
          )
          .then(allResults => {
            const allApiIds = apisToSearch.map(api => api.id)
            const finalApiIds = Array.from(new Set([...existingApiIds, ...allApiIds]))
            const selectedApiIds = selectedAPIs.map(api => api.id)
            const isComplete = selectedApiIds.every(id => finalApiIds.includes(id))

            updateCachedResults(keyword, hasNewResults ? [] : allResults, finalApiIds, isComplete)

            const totalCount = existingResults.length + allResults.length
            toast.success(`搜索完成，共 ${totalCount} 条结果`, { id: 'search-toast' })
          })
          .catch(error => {
            if ((error as Error).name === 'AbortError') {
              toast.dismiss('search-toast')
              return
            }
            console.error('搜索时发生错误:', error)
            toast.error('搜索出错了，请稍后重试', { id: 'search-toast' })
          })
          .finally(() => {
            // 只有当前这次搜索能结束 loading；被取消的旧搜索不能把界面提前置为空态
            if (abortCtrlRef.current === controller) setLoading(false)
          })

        void searchPromise
      }

      const cached = getCachedResults(keyword)
      const selectedApiIds = selectedAPIs.map(api => api.id)
      const sourcePriorityMap = new Map<string, number>()
      selectedAPIs.forEach((api, index) => sourcePriorityMap.set(api.id, api.priority ?? index))

      if (cached) {
        const sortedCachedResults = [...cached.results].sort((a, b) => {
          const priorityA = sourcePriorityMap.get(a.source_code || '') ?? 999
          const priorityB = sourcePriorityMap.get(b.source_code || '') ?? 999
          return priorityA - priorityB
        })

        setSearchRes(sortedCachedResults)

        if (cached.isComplete) {
          setLoading(false)
          return
        }

        const remainingAPIs = selectedAPIs.filter(api => !cached.completedApiIds.includes(api.id))
        if (remainingAPIs.length === 0) {
          setLoading(false)
          updateCachedResults(keyword, [], selectedApiIds, true)
          return
        }

        setLoading(true)
        await searchAPIs(remainingAPIs, cached.results, cached.completedApiIds)
        return
      }

      setSearchRes([])
      await searchAPIs(selectedAPIs, [], [])
    },
    [selectedAPIs, getCachedResults, updateCachedResults],
  )

  useDocumentTitle(query ? `${query}` : '搜索结果')

  useEffect(() => {
    setLoading(true)
    setCurPage(1)
    fetchSearchRes(query)
    return () => {
      abortCtrlRef.current?.abort()
      if (timeOutTimer.current) {
        clearTimeout(timeOutTimer.current)
        timeOutTimer.current = null
      }
      // 离开搜索页时收起"正在搜索"提示，否则它会一直挂在别的页面上
      toast.dismiss('search-toast')
    }
  }, [query, fetchSearchRes])

  const onPageChange = (page: number) => {
    setCurPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const totalPages = paginationRes.length
  const currentItems = paginationRes[curPage - 1] ?? []

  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)

    const pages = new Set<number>([1, totalPages, curPage])
    for (let offset = 1; offset <= 1; offset++) {
      if (curPage - offset > 1) pages.add(curPage - offset)
      if (curPage + offset < totalPages) pages.add(curPage + offset)
    }
    return Array.from(pages).sort((a, b) => a - b)
  }, [curPage, totalPages])

  return (
    <div className="pt-6">
      <SectionHeader
        title={query ? `“${query}”` : '搜索结果'}
        description={
          loading && searchRes.length === 0
            ? `正在搜索 ${selectedAPIs.length} 个源…`
            : `${searchRes.length} 条结果 · ${selectedAPIs.length} 个源`
        }
        action={
          loading ? (
            <span className="flex items-center gap-2 text-xs text-muted-fg">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />
              搜索中…
            </span>
          ) : null
        }
      />

      {!loading && searchRes.length === 0 ? (
        <EmptyState
          icon={<NoResultIcon size={96} />}
          title="没有找到相关内容"
          description="换个关键词试试，或者到设置里检查视频源是否可用。"
        />
      ) : (
        <>
          <PosterGrid>
            {currentItems.map(item => (
              <PosterCard
                key={`${item.source_code}_${item.vod_id}`}
                title={item.vod_name}
                cover={item.vod_pic}
                badge={item.vod_remarks}
                subtitle={item.source_name}
                onPress={() => navigate(`/detail/${item.source_code}/${item.vod_id}`, { state: { item } })}
              />
            ))}
            {loading && searchRes.length < PAGE_SIZE
              ? Array.from({ length: Math.max(0, PAGE_SIZE - currentItems.length) }).map((_, index) => (
                  <div key={`skeleton-${index}`} className="space-y-2">
                    <div className="aspect-[2/3] animate-pulse rounded-xl bg-surface-2" />
                    <div className="h-3.5 w-4/5 animate-pulse rounded bg-surface-2" />
                  </div>
                ))
              : null}
          </PosterGrid>

          {totalPages > 1 ? (
            <div className="mt-10 flex items-center justify-center gap-1.5">
              <button
                type="button"
                disabled={curPage === 1}
                onClick={() => onPageChange(curPage - 1)}
                className="flex h-9 items-center rounded-lg border border-line px-3 text-sm text-fg-soft transition hover:border-line-strong hover:text-fg disabled:cursor-not-allowed disabled:opacity-40"
              >
                上一页
              </button>

              {pageNumbers.map((page, index) => {
                const prev = pageNumbers[index - 1]
                const gap = prev && page - prev > 1
                return (
                  <span key={page} className="flex items-center gap-1.5">
                    {gap ? <span className="px-1 text-muted-fg">…</span> : null}
                    <button
                      type="button"
                      onClick={() => onPageChange(page)}
                      className={`h-9 min-w-9 rounded-lg px-2 text-sm transition ${
                        page === curPage
                          ? 'bg-brand font-semibold text-white'
                          : 'border border-line text-fg-soft hover:border-line-strong hover:text-fg'
                      }`}
                    >
                      {page}
                    </button>
                  </span>
                )
              })}

              <button
                type="button"
                disabled={curPage === totalPages}
                onClick={() => onPageChange(curPage + 1)}
                className="flex h-9 items-center rounded-lg border border-line px-3 text-sm text-fg-soft transition hover:border-line-strong hover:text-fg disabled:cursor-not-allowed disabled:opacity-40"
              >
                下一页
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
