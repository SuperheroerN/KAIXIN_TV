// 豆瓣对没有 cookie 的请求更容易触发反爬限制，带上 bid 可以降低失败率
const DOUBAN_BID = `bid=${Math.random().toString(36).slice(2, 13)}`

// 代理安全校验：只允许公网 http/https，挡住内网/回环地址和 HTML 注入
const BLOCKED_HOST_PATTERN =
  /^(localhost|127\.|0\.0\.0\.0$|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2[0-9]|3[01])\.)/i

function parseSafeTarget(targetUrl: string): URL {
  let parsed: URL
  try {
    parsed = new URL(targetUrl)
  } catch {
    throw new Error('Invalid URL format')
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only http/https URLs are allowed')
  }

  const host = parsed.hostname.toLowerCase()
  if (
    BLOCKED_HOST_PATTERN.test(host) ||
    host === '::1' ||
    host === '[::1]' ||
    host.endsWith('.local') ||
    host.endsWith('.internal')
  ) {
    throw new Error('Target host is not allowed')
  }

  return parsed
}

function isHtmlResponse(contentType: string | null): boolean {
  return !!contentType && contentType.toLowerCase().includes('text/html')
}

function looksLikeHtml(body: string): boolean {
  const head = body.slice(0, 512).trimStart().toLowerCase()
  return head.startsWith('<!doctype html') || head.startsWith('<html')
}

// 按内容类型决定缓存策略：图片长缓存，JSON/文本不缓存，流媒体中等
export function cacheControlFor(contentType: string | null): string {
  const type = (contentType ?? '').toLowerCase()
  if (type.startsWith('image/')) return 'public, max-age=604800, immutable'
  if (type.includes('mpegurl') || type.includes('m3u8')) return 'public, max-age=60'
  if (type.includes('video/') || type.includes('audio/')) return 'public, max-age=86400'
  return 'no-store'
}

// 统一的代理处理逻辑
export async function handleProxyRequest(targetUrl: string): Promise<Response> {
  parseSafeTarget(targetUrl)

  // 根据目标URL设置不同的请求头
  const headers: Record<string, string> = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    Accept: '*/*',
  }

  // 如果是豆瓣域名，添加Referer头
  if (targetUrl.includes('douban.com') || targetUrl.includes('doubanio.com')) {
    headers['Referer'] = 'https://movie.douban.com/'
    headers['Cookie'] = DOUBAN_BID
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

    if (isHtmlResponse(response.headers.get('content-type'))) {
      const body = await response.text()
      if (looksLikeHtml(body)) {
        throw new Error('HTML responses are not proxied')
      }
      const plainHeaders = new Headers(response.headers)
      plainHeaders.set('content-type', 'text/plain; charset=utf-8')
      return new Response(body, {
        status: response.status,
        statusText: response.statusText,
        headers: plainHeaders,
      })
    }

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
