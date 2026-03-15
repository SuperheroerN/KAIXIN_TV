// 统一的代理处理逻辑
export async function handleProxyRequest(targetUrl: string): Promise<Response> {
  // 验证 URL
  try {
    new URL(targetUrl)
  } catch {
    throw new Error('Invalid URL format')
  }

  // 根据目标URL设置不同的请求头
  const headers: Record<string, string> = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    Accept: '*/*',
  }

  // 如果是豆瓣域名，添加Referer头
  if (targetUrl.includes('douban.com') || targetUrl.includes('doubanio.com')) {
    headers['Referer'] = 'https://movie.douban.com/'
    headers['Accept-Language'] = 'zh-CN,zh;q=0.9,en;q=0.8'
  }

  // 发起请求
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000) // 30秒超时

  try {
    const response = await fetch(targetUrl, {
      headers,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('The operation was aborted due to timeout')
    }
    throw error
  }
}

// 从查询参数获取目标 URL
export function getTargetUrl(url: string): string {
  const urlObj = new URL(url, 'http://localhost')
  const targetUrl = urlObj.searchParams.get('url')

  if (!targetUrl) {
    throw new Error('URL parameter is required')
  }

  return decodeURIComponent(targetUrl)
}
