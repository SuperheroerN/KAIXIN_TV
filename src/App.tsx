import { OkiLogo, SearchIcon, SettingIcon } from '@/components/icons'
import { Button, Input, Card, CardFooter, Chip, Tabs, Tab, Skeleton, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/react'
import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useSearch } from '@/hooks'
import RecentHistory from '@/components/RecentHistory'
import { useNavigate } from 'react-router'
import { useTimeBasedTheme } from '@/hooks/useTimeBasedTheme'
import { fetchDoubanRecommend, DOUBAN_CATEGORIES, type DoubanItem } from '@/services/douban.service'
import { getProxiedImageUrl, handleImageError } from '@/utils/imageProxy'

// 主要分类（显示在标签栏）
const MAIN_CATEGORIES = [
  { key: 'hot', label: '热门' },
  { key: 'latest', label: '最新' },
  { key: 'classic', label: '经典' },
  { key: 'high-score', label: '豆瓣高分' },
  { key: 'movie', label: '电影' },
  { key: 'tv', label: '电视剧' },
]

// 分类配置 - 使用豆瓣API
const CATEGORIES = DOUBAN_CATEGORIES

function App() {
  const navigate = useNavigate()
  const { search, setSearch, searchMovie } = useSearch()
  const { isNightMode, toggleTheme } = useTimeBasedTheme()
  
  // 选中的分类（默认热门）
  const [selectedCategory, setSelectedCategory] = useState<string>('hot')
  // 豆瓣推荐数据
  const [doubanItems, setDoubanItems] = useState<DoubanItem[]>([])
  const [loading, setLoading] = useState(false)

  // 加载豆瓣推荐内容
  useEffect(() => {
    const loadDoubanRecommend = async () => {
      const category = CATEGORIES.find(c => c.key === selectedCategory)
      if (!category) return

      console.log('🎬 [首页加载] 加载豆瓣分类:', category.label)

      setLoading(true)
      setDoubanItems([])
      
      try {
        const items = await fetchDoubanRecommend(category.type, category.tag, 20, 0)
        setDoubanItems(items)
      } catch (error) {
        console.error('❌ [首页加载] 加载失败:', error)
        setDoubanItems([])
      } finally {
        setLoading(false)
      }
    }

    loadDoubanRecommend()
  }, [selectedCategory])

  const handleSearch = () => {
    searchMovie(search)
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch()
    }
  }

  // 点击豆瓣推荐卡片 - 触发搜索
  const handleDoubanClick = (item: DoubanItem) => {
    console.log('🔍 点击豆瓣推荐，触发搜索:', item.title)
    searchMovie(item.title)
  }

  return (
    <div className="min-h-screen w-full">
      {/* 顶部导航栏 */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <OkiLogo size={32} />
              <span className="font-bold text-lg">KAIXIN TV</span>
            </div>

            {/* 搜索框 */}
            <div className="flex-1 max-w-xl">
              <Input
                classNames={{
                  base: 'max-w-full',
                  input: 'text-sm',
                  inputWrapper: 'h-10 bg-gray-100/80',
                }}
                placeholder="搜索影视..."
                size="sm"
                variant="flat"
                startContent={<SearchIcon size={16} />}
                value={search}
                onValueChange={setSearch}
                onKeyDown={handleKeyDown}
                endContent={
                  search && (
                    <Button
                      size="sm"
                      radius="full"
                      className="bg-gradient-to-br from-gray-500 to-gray-950 text-white"
                      onPress={handleSearch}
                    >
                      搜索
                    </Button>
                  )
                }
              />
            </div>

            {/* 右侧按钮 */}
            <div className="flex items-center gap-2">
              <Button 
                isIconOnly 
                size="sm"
                variant="light"
                onPress={toggleTheme}
                title={isNightMode ? '切换到白天模式' : '切换到晚上模式'}
              >
                {isNightMode ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                )}
              </Button>
              <Button isIconOnly size="sm" variant="light">
                <RecentHistory />
              </Button>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => navigate('/settings')}
              >
                <SettingIcon size={20} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 分类导航 */}
      <div className="border-b border-gray-200/50 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2">
            {/* 主要分类标签 */}
            <div className="flex-1 overflow-x-auto scrollbar-hide">
              <Tabs
                selectedKey={selectedCategory}
                onSelectionChange={(key) => setSelectedCategory(key as string)}
                variant="underlined"
                classNames={{
                  tabList: 'gap-4 flex-nowrap',
                  cursor: 'bg-gray-900 dark:bg-white',
                  tab: 'h-12 px-4 whitespace-nowrap',
                }}
              >
                {MAIN_CATEGORIES.map(category => (
                  <Tab key={category.key} title={category.label} />
                ))}
              </Tabs>
            </div>
            
            {/* 更多分类下拉菜单 */}
            <Dropdown>
              <DropdownTrigger>
                <Button 
                  variant="light" 
                  size="sm"
                  className="h-12 px-4 whitespace-nowrap"
                >
                  更多分类 ▼
                </Button>
              </DropdownTrigger>
              <DropdownMenu 
                aria-label="更多分类"
                onAction={(key) => setSelectedCategory(key as string)}
                className="max-h-[500px] overflow-y-auto"
              >
                <DropdownItem key="genre-header" isReadOnly className="opacity-50 font-semibold">
                  电影类型
                </DropdownItem>
                <DropdownItem key="action">动作</DropdownItem>
                <DropdownItem key="comedy">喜剧</DropdownItem>
                <DropdownItem key="romance">爱情</DropdownItem>
                <DropdownItem key="scifi">科幻</DropdownItem>
                <DropdownItem key="suspense">悬疑</DropdownItem>
                <DropdownItem key="horror">恐怖</DropdownItem>
                <DropdownItem key="art">文艺</DropdownItem>
                
                <DropdownItem key="region-header" isReadOnly className="opacity-50 font-semibold mt-2">
                  地区
                </DropdownItem>
                <DropdownItem key="chinese">华语</DropdownItem>
                <DropdownItem key="western">欧美</DropdownItem>
                <DropdownItem key="korean">韩国</DropdownItem>
                <DropdownItem key="japanese">日本</DropdownItem>
                
                <DropdownItem key="tv-header" isReadOnly className="opacity-50 font-semibold mt-2">
                  电视剧
                </DropdownItem>
                <DropdownItem key="us-drama">美剧</DropdownItem>
                <DropdownItem key="uk-drama">英剧</DropdownItem>
                <DropdownItem key="kr-drama">韩剧</DropdownItem>
                <DropdownItem key="jp-drama">日剧</DropdownItem>
                <DropdownItem key="cn-drama">国产剧</DropdownItem>
                <DropdownItem key="hk-drama">港剧</DropdownItem>
                
                <DropdownItem key="other-header" isReadOnly className="opacity-50 font-semibold mt-2">
                  其他
                </DropdownItem>
                <DropdownItem key="anime">日本动画</DropdownItem>
                <DropdownItem key="variety">综艺</DropdownItem>
                <DropdownItem key="documentary">纪录片</DropdownItem>
                <DropdownItem key="hidden-gem">冷门佳片</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>
      </div>

      {/* 推荐视频内容 */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <Card key={i} className="h-64">
                <Skeleton className="h-full w-full rounded-lg" />
              </Card>
            ))}
          </div>
        ) : doubanItems.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {doubanItems.map((item, index) => (
              <motion.div
                key={`${item.id}_${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  isPressable
                  isFooterBlurred
                  onPress={() => handleDoubanClick(item)}
                  className="h-64 hover:scale-105 transition-transform"
                >
                  <div className="relative w-full h-full">
                    <img
                      alt={item.title}
                      className="w-full h-full object-cover"
                      src={getProxiedImageUrl(item.cover)}
                      data-original-url={item.cover}
                      onError={(e) => handleImageError(e, item.title)}
                      loading="lazy"
                    />
                  </div>
                  <CardFooter className="absolute bottom-0 z-10 border-t border-white/20 bg-black/40 backdrop-blur">
                    <div className="flex flex-col gap-1 w-full">
                      <p className="text-sm font-semibold text-white line-clamp-2">{item.title}</p>
                      {item.rate && (
                        <Chip size="sm" color="warning" variant="flat" className="text-xs">
                          ⭐ {item.rate}
                        </Chip>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-500">暂无内容</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
