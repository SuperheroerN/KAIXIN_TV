import { useEffect, useRef, useState } from 'react'
import { SearchIcon } from '@/components/icons'
import { useSearch } from '@/hooks'
import { useSearchStore } from '@/store/searchStore'
import { useSettingStore } from '@/store/settingStore'
import { cn } from '@/utils'

interface SearchBoxProps {
  className?: string
  placeholder?: string
}

/**
 * 顶栏搜索框：支持回车搜索、历史记录下拉
 */
export default function SearchBox({ className, placeholder = '搜索电影、电视剧、综艺…' }: SearchBoxProps) {
  const { searchMovie } = useSearch()
  const query = useSearchStore(state => state.query)
  const setSearch = useSearchStore(state => state.setQuery)
  const searchHistory = useSearchStore(state => state.searchHistory)
  const removeSearchHistoryItem = useSearchStore(state => state.removeSearchHistoryItem)
  const clearSearchHistory = useSearchStore(state => state.clearSearchHistory)
  const searchSettings = useSettingStore(state => state.search)

  const [value, setValue] = useState(query)
  const [focused, setFocused] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setValue(query)
  }, [query])

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setFocused(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const submit = (keyword: string) => {
    const trimmed = keyword.trim()
    if (!trimmed) return
    setSearch(trimmed)
    searchMovie(trimmed)
    setFocused(false)
  }

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <div
        className={cn(
          'flex h-10 items-center gap-2 rounded-full border border-line bg-surface-2 px-3.5 transition',
          focused && 'border-brand/60 bg-surface ring-2 ring-brand/20',
        )}
      >
        <span className="shrink-0 text-muted-fg">
          <SearchIcon size={16} />
        </span>
        <input
          value={value}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onChange={event => {
            setValue(event.target.value)
            setSearch(event.target.value)
          }}
          onKeyDown={event => {
            if (event.key === 'Enter') submit(value)
            if (event.key === 'Escape') setFocused(false)
          }}
          className="h-full w-full bg-transparent text-sm text-fg placeholder:text-muted-fg focus:outline-none"
        />
        {value ? (
          <button
            type="button"
            aria-label="清空"
            onClick={() => {
              setValue('')
              setSearch('')
            }}
            className="shrink-0 text-muted-fg transition hover:text-fg"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        ) : null}
      </div>

      {focused && searchSettings.isSearchHistoryVisible && searchHistory.length > 0 ? (
        <div className="absolute top-12 left-0 z-50 w-full overflow-hidden rounded-xl border border-line bg-surface shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between px-3 py-2 text-[11px] text-muted-fg">
            <span>搜索历史</span>
            <button type="button" onClick={clearSearchHistory} className="hover:text-brand">
              清空
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto pb-1">
            {searchHistory.map(item => (
              <div
                key={item.id}
                onClick={() => submit(item.content)}
                className="group flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm text-fg-soft transition hover:bg-surface-2"
              >
                <span className="line-clamp-1">{item.content}</span>
                <button
                  type="button"
                  aria-label="删除"
                  onClick={event => {
                    event.stopPropagation()
                    removeSearchHistoryItem(item.id)
                  }}
                  className="text-muted-fg opacity-0 transition group-hover:opacity-100 hover:text-brand"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
