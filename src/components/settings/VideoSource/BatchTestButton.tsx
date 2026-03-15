import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import type { VideoApi } from '@/types'
import { API_CONFIG, PROXY_URL } from '@/config/api.config'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'

interface SourceTestResult {
  source: VideoApi
  status: 'pending' | 'testing' | 'success' | 'error' | 'not-supported'
  message: string
  responseTime?: number
  resultCount?: number
}

export default function BatchTestButton({ sources }: { sources: VideoApi[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [results, setResults] = useState<SourceTestResult[]>([])

  const buildApiUrl = (baseUrl: string, configPath: string, queryValue: string): string => {
    const url = baseUrl.replace(/\/+$/, '')
    const [pathPart, queryPart] = configPath.split('?')

    if (
      url.toLowerCase().endsWith(pathPart.replace(/\/+$/, '').toLowerCase()) ||
      url.toLowerCase().includes('/api.php/provide/vod')
    ) {
      const prefix = url.includes('?') ? '&' : '?'
      return `${url}${prefix}${queryPart}${queryValue}`
    }

    return `${url}${configPath}${queryValue}`
  }

  const testSingleSource = async (source: VideoApi): Promise<SourceTestResult> => {
    try {
      const testKeyword = '测试'
      const apiUrl = buildApiUrl(
        source.url,
        API_CONFIG.search.path,
        encodeURIComponent(testKeyword),
      )

      const startTime = Date.now()
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30秒超时

      const response = await fetch(PROXY_URL + encodeURIComponent(apiUrl), {
        headers: API_CONFIG.search.headers,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      const responseTime = Date.now() - startTime

      if (!response.ok) {
        return {
          source,
          status: 'error',
          message: `HTTP错误: ${response.status}`,
          responseTime,
        }
      }

      const text = await response.text()

      // 检查是否不支持搜索
      if (
        text.includes('暂不支持搜索') ||
        text.includes('不支持搜索') ||
        text.includes('not support search')
      ) {
        return {
          source,
          status: 'not-supported',
          message: '不支持搜索',
          responseTime,
        }
      }

      // 尝试解析JSON
      try {
        const data = JSON.parse(text)

        if (!data || !Array.isArray(data.list)) {
          return {
            source,
            status: 'error',
            message: '数据格式无效',
            responseTime,
          }
        }

        const resultCount = data.list.length

        return {
          source,
          status: 'success',
          message: `支持搜索 (${resultCount}条结果)`,
          responseTime,
          resultCount,
        }
      } catch (e) {
        return {
          source,
          status: 'error',
          message: 'JSON解析失败',
          responseTime,
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            source,
            status: 'error',
            message: '请求超时',
          }
        }
        return {
          source,
          status: 'error',
          message: error.message,
        }
      }
      return {
        source,
        status: 'error',
        message: '未知错误',
      }
    }
  }

  const testAllSources = async () => {
    setIsTesting(true)
    setResults(
      sources.map(source => ({
        source,
        status: 'pending' as const,
        message: '等待测试...',
      })),
    )

    let successCount = 0
    let notSupportedCount = 0
    let errorCount = 0

    // 串行测试，避免并发过多
    for (let i = 0; i < sources.length; i++) {
      const source = sources[i]

      // 更新状态为测试中
      setResults(prev =>
        prev.map((r, idx) => (idx === i ? { ...r, status: 'testing' as const } : r)),
      )

      const result = await testSingleSource(source)

      // 更新测试结果
      setResults(prev => prev.map((r, idx) => (idx === i ? result : r)))

      if (result.status === 'success') successCount++
      else if (result.status === 'not-supported') notSupportedCount++
      else errorCount++

      // 间隔500ms避免请求过快
      if (i < sources.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    setIsTesting(false)
    toast.success(
      `测试完成: ${successCount}个支持, ${notSupportedCount}个不支持, ${errorCount}个错误`,
    )
  }

  const getStatusIcon = (status: SourceTestResult['status']) => {
    switch (status) {
      case 'testing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'not-supported':
        return <AlertCircle className="h-4 w-4 text-orange-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
    }
  }

  const getStatusColor = (status: SourceTestResult['status']) => {
    switch (status) {
      case 'success':
        return 'text-green-600'
      case 'not-supported':
        return 'text-orange-500'
      case 'error':
        return 'text-red-600'
      case 'testing':
        return 'text-blue-500'
      default:
        return 'text-gray-500'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          批量测试所有源
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>批量测试视频源搜索支持</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">共 {sources.length} 个视频源</p>
            <Button onClick={testAllSources} disabled={isTesting}>
              {isTesting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  测试中...
                </>
              ) : (
                '开始测试'
              )}
            </Button>
          </div>

          <ScrollArea className="h-96 rounded-md border p-4">
            <div className="flex flex-col gap-3">
              {results.length === 0 ? (
                <p className="text-center text-sm text-gray-500">点击"开始测试"进行批量测试</p>
              ) : (
                results.map(result => (
                  <div
                    key={result.source.id}
                    className="flex items-start justify-between gap-4 rounded-lg border p-3"
                  >
                    <div className="flex items-start gap-3">
                      {getStatusIcon(result.status)}
                      <div className="flex flex-col gap-1">
                        <p className="font-medium">{result.source.name}</p>
                        <p className={`text-sm ${getStatusColor(result.status)}`}>
                          {result.message}
                          {result.responseTime && (
                            <span className="ml-2 text-xs text-gray-500">
                              {result.responseTime}ms
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-400">{result.source.url}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {results.length > 0 && !isTesting && (
            <div className="rounded-lg bg-gray-50 p-3 text-sm">
              <p className="font-medium">测试结果统计：</p>
              <div className="mt-2 flex gap-4">
                <span className="text-green-600">
                  ✓ 支持: {results.filter(r => r.status === 'success').length}
                </span>
                <span className="text-orange-500">
                  ⚠ 不支持: {results.filter(r => r.status === 'not-supported').length}
                </span>
                <span className="text-red-600">
                  ✗ 错误: {results.filter(r => r.status === 'error').length}
                </span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
