import { useNavigate } from 'react-router'
import { useSearchStore } from '@/store/searchStore'

export const useSearch = () => {
  const navigate = useNavigate()

  // 从 zustand store 获取状态和操作
  const { query: search, setQuery: setSearch, addSearchHistoryItem, clearQuery } = useSearchStore()

  const searchMovie = (query: string, isNavigating: boolean = true) => {
    const trimmed = query.trim()
    if (trimmed.length > 0) {
      // 设置当前搜索查询
      setSearch(trimmed)

      // 添加到搜索历史
      addSearchHistoryItem(trimmed)

      // 导航到搜索页面
      if (isNavigating) {
        navigate(`/search/${encodeURIComponent(trimmed)}`)
      }
    }
  }

  const clearSearch = () => {
    clearQuery()
  }

  return {
    search,
    setSearch,
    searchMovie,
    clearSearch,
  }
}
