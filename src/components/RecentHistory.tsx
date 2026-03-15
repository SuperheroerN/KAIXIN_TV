import { CloseIcon, NoItemIcon, RecentIcon, TrashIcon } from '@/components/icons'
import { Card, Chip, Image, Tooltip, Progress } from '@heroui/react'
import { ScrollShadow } from '@heroui/react'
import { useViewingHistoryStore } from '@/store/viewingHistoryStore'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import { NavLink } from 'react-router'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { isBrowser } from 'react-device-detect'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import type { ViewingHistoryItem } from '@/types'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')
dayjs.extend(duration)

// 格式化集数显示
const formatEpisodeDisplay = (item: ViewingHistoryItem): string => {
  if (item.episodeName) {
    return item.episodeName
  }
  return `第${item.episodeIndex + 1}集`
}

const HistoryList = ({
  viewingHistory,
  removeViewingHistory,
}: {
  viewingHistory: ViewingHistoryItem[]
  removeViewingHistory: (item: ViewingHistoryItem) => void
}) => {
  const filteredHistory = useMemo(() => {
    const historyMap = new Map()
    viewingHistory.forEach(item => {
      const key = `${item.sourceCode}-${item.vodId}`
      if (!historyMap.has(key)) {
        historyMap.set(key, item)
      }
    })
    return Array.from(historyMap.values())
  }, [viewingHistory])
  if (filteredHistory.length === 0) {
    return (
      <div className="mt-5 flex flex-col items-center justify-center gap-2">
        <NoItemIcon size={128} />
        <p className="mt-2 text-sm text-gray-500">暂无观看记录</p>
      </div>
    )
  }
  return (
    <>
      <ScrollShadow hideScrollBar className="max-h-[50vh] overflow-y-auto bg-transparent p-2">
        {filteredHistory.map((item, index) => (
          <Card
            className="@container mb-[.6rem] h-[30vw] w-full bg-white/30 shadow-md/5 transition-all duration-500 hover:scale-101 hover:shadow-lg md:h-[8rem] md:w-[25rem]"
            key={index}
            isPressable
            shadow="sm"
            onPress={() => console.log('item pressed')}
          >
            <NavLink
              className="w-full"
              to={`/video/${item.sourceCode}/${item.vodId}/${item.episodeIndex}`}
            >
              <div className="flex h-[30vw] w-full md:h-[8rem]">
                <div className="relative shrink-0">
                  <Image
                    alt={item.title}
                    radius="lg"
                    shadow="sm"
                    loading="lazy"
                    isZoomed
                    isBlurred
                    classNames={{
                      zoomedWrapper: 'h-full aspect-square',
                      wrapper: 'h-full aspect-square',
                      img: 'h-full w-full object-cover',
                    }}
                    src={item.imageUrl}
                  />
                  <Progress
                    aria-label="Progress"
                    value={(item.playbackPosition / item.duration) * 100}
                    color="primary"
                    className="absolute bottom-0 z-10 w-full"
                    classNames={{
                      base: 'h-[1.5cqw]',
                    }}
                  />
                </div>
                <div className="group flex h-full w-full flex-col items-start justify-between p-[4cqw] md:gap-3 md:p-4">
                  <div className="flex w-full items-center justify-between gap-[2cqw] md:gap-2">
                    <Chip
                      color="primary"
                      variant="solid"
                      classNames={{
                        base: 'h-[6cqw] px-[3%] md:h-6 md:px-2',
                        content: 'text-[3cqw] md:text-xs',
                      }}
                    >
                      {item.sourceName}
                    </Chip>
                    <div className="flex items-center justify-center gap-[.6rem] text-[3.5cqw] text-gray-500 md:text-sm">
                      <p>{dayjs(item.timestamp).fromNow()}</p>
                      <motion.div
                        initial={{ color: '#888888' }}
                        whileHover={{ color: '#d6204b', backgroundColor: '#f0f0f0' }}
                        transition={{ duration: 0.4 }}
                        className="flex h-[1.5rem] w-[1.5rem] items-center justify-center rounded-full"
                        onClick={e => {
                          e.preventDefault()
                          e.stopPropagation()
                          removeViewingHistory(item)
                        }}
                      >
                        <TrashIcon size={16} />
                      </motion.div>
                    </div>
                  </div>
                  <div className="line-clamp-1 text-[4.5cqw] font-bold text-gray-700 transition-colors duration-200 group-hover:text-indigo-400 group-hover:underline md:text-lg">
                    {item.title}
                  </div>
                  <div className="flex w-full items-center justify-between gap-[2cqw] text-[3cqw] md:gap-2 md:text-xs">
                    <div className="text-gray-500">{formatEpisodeDisplay(item)}</div>
                    <div className="text-gray-500">
                      已看 {((item.playbackPosition / item.duration) * 100).toFixed(0)}%{' '}
                    </div>
                  </div>
                  {/* <Progress
                    aria-label="Progress"
                    label={`${dayjs.duration(item.playbackPosition, 'seconds').format('HH:mm:ss')} / ${dayjs.duration(item.duration, 'seconds').format('HH:mm:ss')}`}
                    value={(item.playbackPosition / item.duration) * 100}
                    color="primary"
                    size="sm"
                  /> */}
                </div>
              </div>
            </NavLink>
          </Card>
        ))}
        <div className="mt-5 flex items-center justify-center">
          <p className="text-sm text-gray-500">没有更多了</p>
        </div>
      </ScrollShadow>
    </>
  )
}

export default function RecentHistory() {
  const [isOpen, setIsOpen] = useState(false)
  const { viewingHistory, removeViewingHistory, clearViewingHistory } = useViewingHistoryStore()
  return (
    <>
      <Tooltip
        isOpen={isBrowser ? undefined : false}
        // isOpen={true}
        classNames={{
          base: 'bg-transparent',
          content:
            'flex justify-start min-h-[40vh] max-h-[60vh] p-2 bg-white/50 shadow-xl/30 shadow-gray-500/30 backdrop-blur-lg',
        }}
        content={
          <>
            <div className="h-full">
              <div className="mt-2 mb-2 flex w-full items-end justify-between">
                <div className="flex-1"></div>
                <div className="text-center text-lg font-bold text-gray-800">观看记录</div>
                <div className="flex flex-1 items-center justify-end">
                  {viewingHistory.length > 0 && (
                    <motion.div
                      initial={{ color: '#aaaaaa' }}
                      whileHover={{ color: '#666666' }}
                      transition={{ duration: 0.4 }}
                      className="flex items-center justify-center gap-1 pr-3 hover:cursor-pointer"
                      onClick={clearViewingHistory}
                    >
                      <CloseIcon size={16} />
                      <p className="text-sm">清除历史</p>
                    </motion.div>
                  )}
                </div>
              </div>
              <div className="min-w-[25rem]">
                <HistoryList
                  viewingHistory={viewingHistory}
                  removeViewingHistory={removeViewingHistory}
                />
              </div>
            </div>
          </>
        }
        shadow="lg"
        placement="bottom"
        offset={30}
      >
        <div
          onClick={isBrowser ? undefined : () => setIsOpen(!isOpen)}
          className="flex h-full w-full items-center justify-center"
        >
          <RecentIcon size={24} />
        </div>
      </Tooltip>
      {!isBrowser &&
        isOpen &&
        createPortal(
          <div
            className={clsx(
              'fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/50 opacity-0 shadow-xl/30 shadow-gray-500/30 backdrop-blur-xl transition-opacity duration-2000',
              isOpen && 'opacity-100',
            )}
            onClick={() => setIsOpen(false)}
          >
            <div className="flex h-[90vh] w-[90vw] flex-col items-center justify-start">
              <div className="mt-[5vh] mb-2 flex h-fit w-full items-end justify-between px-4">
                <div className="flex-1"></div>
                <div className="text-center text-2xl font-bold text-gray-800">观看记录</div>
                <div className="flex flex-1 items-center justify-end">
                  {viewingHistory.length > 0 && (
                    <motion.div
                      initial={{ color: '#aaaaaa' }}
                      whileHover={{ color: '#666666' }}
                      transition={{ duration: 0.4 }}
                      className="flex items-center justify-center gap-1"
                      onClick={e => {
                        e.stopPropagation()
                        clearViewingHistory()
                      }}
                    >
                      <CloseIcon size={20} />
                      <p className="text-base">清除历史</p>
                    </motion.div>
                  )}
                </div>
              </div>
              <div className="w-full overflow-hidden" onClick={e => e.stopPropagation()}>
                <HistoryList
                  viewingHistory={viewingHistory}
                  removeViewingHistory={removeViewingHistory}
                />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
