import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import type { VideoApi } from '@/types'
import { API_CONFIG, PROXY_URL } from '@/config/api.config'

interface TestResult {
  status: 'idle' | 'testing' | 'success' | 'error' | 'not-supported'
  message: string
  responseTime?: number
  resultCount?: number
}

export default function SourceTestButton({ source }: { source: VideoApi }) {
  const [testResult, setTestResult] = useState<TestResult>({
    status: 'idle',
    message: '',
  })

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

  const testSearchSupport = async () => {
    setTestResult({ status: 'testing', message: '正在测试...' })

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
        setTestResult({
          status: 'error',
          message: `HTTP错误: ${response.status}`,
          responseTime,
        })
        toast.error(`${source.name} 测试失败: HTTP ${response.status}`)
        return
      }

      const text = await response.text()

      // 检查是否不支持搜索
      if (
        text.includes('暂不支持搜索') ||
        text.includes('不支持搜索') ||
        text.includes('not support search')
      ) {
        setTestResult({
          status: 'not-supported',
          message: '该源不支持搜索功能',
          responseTime,
        })
        toast.warning(`${source.name} 不支持搜索功能`)
        return
      }

      // 尝试解析JSON
      try {
        const data = JSON.parse(text)

        if (!data || !Array.isArray(data.list)) {
          setTestResult({
            status: 'error',
            message: '返回数据格式无效',
            responseTime,
          })
          toast.error(`${source.name} 返回数据格式无效`)
          return
        }

        const resultCount = data.list.length

        setTestResult({
          status: 'success',
          message: `支持搜索，返回 ${resultCount} 条结果`,
          responseTime,
          resultCount,
        })
        toast.success(`${source.name} 支持搜索功能 (${responseTime}ms)`)
      } catch (e) {
        setTestResult({
          status: 'error',
          message: 'JSON解析失败',
          responseTime,
        })
        toast.error(`${source.name} 返回数据无法解析`)
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          setTestResult({
            status: 'error',
            message: '请求超时',
          })
          toast.error(`${source.name} 请求超时`)
        } else {
          setTestResult({
            status: 'error',
            message: error.message,
          })
          toast.error(`${source.name} 测试失败: ${error.message}`)
        }
      }
    }
  }

  const getStatusIcon = () => {
    switch (testResult.status) {
      case 'testing':
        return <Loader2 className="h-4 w-4 animate-spin" />
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'not-supported':
        return <AlertCircle className="h-4 w-4 text-orange-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return null
    }
  }

  const getStatusColor = () => {
    switch (testResult.status) {
      case 'success':
        return 'text-green-600'
      case 'not-supported':
        return 'text-orange-500'
      case 'error':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={testSearchSupport}
        disabled={testResult.status === 'testing'}
        className="w-full"
      >
        {testResult.status === 'testing' ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            测试中...
          </>
        ) : (
          '测试搜索支持'
        )}
      </Button>

      {testResult.status !== 'idle' && (
        <div className={`flex items-center gap-2 text-sm ${getStatusColor()}`}>
          {getStatusIcon()}
          <span>{testResult.message}</span>
          {testResult.responseTime && (
            <span className="text-xs text-gray-500">({testResult.responseTime}ms)</span>
          )}
        </div>
      )}
    </div>
  )
}
