import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/utils'
import { useRef, useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useApiStore } from '@/store/apiStore'
import dayjs from 'dayjs'
import VideoSourceForm from './VideoSourceForm'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { URLSourceModal, TextSourceModal } from './ImportSourceModal'
import BatchTestButton from './BatchTestButton'

export default function VideoSource() {
  // 视频源
  const {
    videoAPIs,
    importVideoAPIs,
  } = useApiStore()
  // 用于显示的源列表
  const [showVideoAPIs, setShowVideoAPIs] = useState(videoAPIs)
  useEffect(() => {
    setShowVideoAPIs(videoAPIs)
  }, [videoAPIs])
  // 全选逻辑（已禁用）
  // const isAllSelected = getSelectedAPIs().length === showVideoAPIs.length
  // 已禁用：切换全选/全不选
  // const handleToggleAll = () => {
  //   if (isAllSelected) {
  //     deselectAllAPIs()
  //   } else {
  //     selectAllAPIs()
  //   }
  // }
  const [selectedIndex, setSelectedIndex] = useState(0)

  // 确保 selectedIndex 在有效范围内，防止删除最后一个元素时数组越界
  const safeIndex = Math.min(selectedIndex, Math.max(0, showVideoAPIs.length - 1))
  const selectedSource = showVideoAPIs[safeIndex]

  // 如果 selectedIndex 超出范围，更新它 (可选，为了状态一致性)
  useEffect(() => {
    if (selectedIndex !== safeIndex) {
      setSelectedIndex(safeIndex)
    }
  }, [selectedIndex, safeIndex])

  // 添加视频源（已禁用，仅保留用于类型检查）
  // const addVideoSource = () => {
  //   setShowVideoAPIs([
  //     ...showVideoAPIs,
  //     {
  //       id: uuidv4(),
  //       name: '新增源',
  //       url: '',
  //       detailUrl: '',
  //       timeout: useSettingStore.getState().network.defaultTimeout || 3000,
  //       retry: useSettingStore.getState().network.defaultRetry || 3,
  //       isEnabled: true,
  //       updatedAt: new Date(),
  //     },
  //   ])
  //   setSelectedIndex(showVideoAPIs.length)
  // }
  // 导入 input ref
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 从JSON文件导入视频源（已禁用）
  // const addVideoSourceFromJSONFile = () => {
  //   fileInputRef.current?.click()
  // }

  // 处理文件选择
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = e => {
      try {
        const content = e.target?.result as string
        const sources = JSON.parse(content)
        if (Array.isArray(sources)) {
          importVideoAPIs(sources)
          toast.success(`成功导入 ${sources.length} 个视频源`)
        } else {
          toast.error('导入失败：文件格式错误，应为数组格式')
        }
      } catch (error) {
        console.error('Import error:', error)
        toast.error('导入失败：JSON 解析错误')
      }
      // 清空 input value，允许重复选择同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
    reader.readAsText(file)
  }

  // 处理从URL中导入（已禁用）
  const [urlSourceModalOpen, setUrlSourceModalOpen] = useState(false)
  // const addVideoSourceFromURL = () => {
  //   setUrlSourceModalOpen(true)
  // }

  // 处理从文本导入（已禁用）
  const [textSourceModalOpen, setTextSourceModalOpen] = useState(false)
  // const addVideoSourceFromText = () => {
  //   setTextSourceModalOpen(true)
  // }

  // 导出为文件（已禁用）
  // const handleExportToFile = () => {
  //   try {
  //     const data = JSON.stringify(videoAPIs, null, 2)
  //     const blob = new Blob([data], { type: 'application/json' })
  //     const url = URL.createObjectURL(blob)
  //     const link = document.createElement('a')
  //     link.href = url
  //     link.download = `ouonnki-tv-sources-${dayjs().format('YYYY-MM-DD')}.json`
  //     document.body.appendChild(link)
  //     link.click()
  //     document.body.removeChild(link)
  //     URL.revokeObjectURL(url)
  //     toast.success('导出成功')
  //   } catch (error) {
  //     console.error('Export error:', error)
  //     toast.error('导出失败')
  //   }
  // }

  // 导出为文本（已禁用）
  // const handleExportToText = async () => {
  //   try {
  //     const data = JSON.stringify(videoAPIs, null, 2)
  //     await navigator.clipboard.writeText(data)
  //     toast.success('已复制到剪贴板')
  //   } catch (error) {
  //     console.error('Copy error:', error)
  //     toast.error('复制失败，请手动复制')
  //   }
  // }

  return (
    <>
      <URLSourceModal open={urlSourceModalOpen} onOpenChange={setUrlSourceModalOpen} />
      <TextSourceModal open={textSourceModalOpen} onOpenChange={setTextSourceModalOpen} />
      <div className="flex flex-col gap-2">
        <div className="flex items-end justify-between gap-5 px-4 md:px-0">
          <div className="flex flex-col gap-1 md:pl-2">
            <h1 className="text-md font-semibold text-gray-700">视频源列表</h1>
            <p className="text-xs text-gray-400">
              视频源通过环境变量配置，以下为当前已配置的视频源（仅供查看）
            </p>
          </div>
          <div className="w-40">
            <BatchTestButton sources={videoAPIs} />
          </div>
        </div>
        <div className="flex flex-col md:flex-row">
          {/* Desktop: Sidebar List */}
          <div className="hidden w-60 flex-col md:flex">
            <div className="flex items-center justify-between px-4 py-2">
              <p className="text-sm text-gray-500">
                共 {videoAPIs.length} 个视频源
              </p>
            </div>
            <ScrollArea className="border-t border-gray-300/40 py-4 pr-3">
              <div className="flex max-h-155 flex-col gap-2 text-gray-700">
                {showVideoAPIs.length === 0 && (
                  <div className="flex h-full items-center justify-center">
                    <p>暂无视频源</p>
                  </div>
                )}
                {showVideoAPIs.map((source, index) => (
                  <div
                    className={cn(
                      'flex h-10 items-center justify-between rounded-md p-4 hover:cursor-pointer hover:bg-white/20 hover:backdrop-blur-xl',
                      selectedSource?.id === source.id ? 'bg-white/40 backdrop-blur-xl' : '',
                    )}
                    key={source.id}
                    onClick={() => setSelectedIndex(index)}
                  >
                    <p>{source.name}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="flex h-full flex-1 flex-col border-t border-gray-300/40 p-4 backdrop-blur-xl md:border-t-0 md:border-l">
            {selectedSource ? (
              <>
                <div className="flex items-center justify-between border-b border-gray-300/40 pb-2">
                  <div className="flex flex-col gap-1">
                    <h1 className="text-xl font-semibold text-gray-800">{selectedSource.name}</h1>
                    <p className="text-xs text-gray-500">
                      最后更新时间：
                      {dayjs(selectedSource.updatedAt).format('YYYY-MM-DD HH:mm:ss')}
                    </p>
                  </div>
                  {/* Mobile: Source Switcher Button */}
                  <div className="md:hidden">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="bg-white/40 backdrop-blur-xl">
                          切换视频源
                          <ChevronRight />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="flex max-h-[80vh] flex-col">
                        <DialogHeader>
                          <DialogTitle>选择视频源</DialogTitle>
                        </DialogHeader>
                        <div className="flex items-center justify-between py-2">
                          <p className="text-sm text-gray-500">
                            共 {videoAPIs.length} 个视频源
                          </p>
                        </div>
                        <ScrollArea className="flex-1 rounded-md pr-2">
                          <div className="flex h-100 flex-col gap-2 rounded-md">
                            {showVideoAPIs.map((source, index) => (
                              <div
                                className={cn(
                                  'flex h-12 items-center justify-between rounded-md border border-transparent px-4 py-2 transition-colors hover:cursor-pointer',
                                  selectedSource?.id === source.id
                                    ? 'border-gray-200 bg-gray-100'
                                    : 'hover:bg-gray-50',
                                )}
                                key={source.id}
                                onClick={() => setSelectedIndex(index)}
                              >
                                <p
                                  className={cn(
                                    'font-medium',
                                    selectedSource?.id === source.id
                                      ? 'text-primary'
                                      : 'text-gray-700',
                                  )}
                                >
                                  {source.name}
                                </p>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                <VideoSourceForm sourceInfo={selectedSource} readOnly={true} />
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-500">
                请选择或点击右上角添加视频源
              </div>
            )}
          </div>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".json"
          onChange={handleFileChange}
        />
      </div>
    </>
  )
}
