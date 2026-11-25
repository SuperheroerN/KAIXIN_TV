// Cloudflare Pages Function
// 部署到 Cloudflare Pages 时，此文件会自动处理 /proxy 路由
// 需要安装类型定义: pnpm add -D @cloudflare/workers-types

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

// 有的源站把 ?wd= 这类查询参数当成攻击特征，会回 Cloudflare 人机验证页（403 + HTML）；
// 同样的参数放进 POST 表单通常能过，所以只在这种响应上做一次重试
const CHALLENGE_PATTERN = /just a moment|cf-chl|attention required|checking your browser/i

function looksLikeChallenge(status: number, contentType: string | null, body: string): boolean {
  if (status !== 403 && status !== 503) return false
  if (!contentType || !contentType.toLowerCase().includes('text/html')) return false
  return CHALLENGE_PATTERN.test(body.slice(0, 2048))
}

async function retryAsPostForm(
  target: URL,
  headers: Record<string, string>,
): Promise<Response | null> {
  const body = target.search.replace(/^\?/, '')
  if (!body) return null

  try {
    return await fetch(`${target.origin}${target.pathname}`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(15000),
    })
  } catch {
    return null
  }
}

// 只转发播放/展示需要的内容类型；其余一律 415，避免变成通用下载中继
const ALLOWED_TYPE_PATTERNS = [
  /^image\//i,
  /^video\//i,
  /^audio\//i,
  /^text\/plain/i,
  /^application\/json/i,
  /\+json$/i,
  /mpegurl/i,
]

// 单次响应上限：超过即拒绝，避免大文件长期占用函数实例
const MAX_RESPONSE_BYTES = 20 * 1024 * 1024

function isAllowedContentType(contentType: string | null): boolean {
  if (!contentType) return false
  return ALLOWED_TYPE_PATTERNS.some(pattern => pattern.test(contentType))
}

function limitBodySize(body: ReadableStream<Uint8Array> | null): ReadableStream<Uint8Array> | null {
  if (!body) return null
  const reader = body.getReader()
  let total = 0
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { done, value } = await reader.read()
      if (done) {
        controller.close()
        return
      }
      total += value.byteLength
      if (total > MAX_RESPONSE_BYTES) {
        await reader.cancel().catch(() => undefined)
        controller.close()
        return
      }
      controller.enqueue(value)
    },
    cancel(reason) {
      return reader.cancel(reason)
    },
  })
}

// 按内容类型决定缓存策略：图片长缓存，JSON/文本不缓存，流媒体中等
function cacheControlFor(contentType: string | null): string {
  const type = (contentType ?? '').toLowerCase()
  if (type.startsWith('image/')) return 'public, max-age=604800, immutable'
  if (type.includes('mpegurl') || type.includes('m3u8')) return 'public, max-age=60'
  if (type.includes('video/') || type.includes('audio/')) return 'public, max-age=86400'
  return 'no-store'
}


interface Context {
  request: Request
  env: unknown
  params: unknown
}

export const onRequest = async (context: Context) => {
  const url = new URL(context.request.url)
  const targetUrl = url.searchParams.get('url')

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  if (context.request.method !== 'GET' && context.request.method !== 'HEAD') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        Allow: 'GET, HEAD, OPTIONS',
        ...corsHeaders,
      },
    })
  }

  if (!targetUrl) {
    return new Response(JSON.stringify({ error: 'URL parameter is required' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        ...corsHeaders,
      },
    })
  }

  try {
    const target = parseSafeTarget(targetUrl)

    // 设置请求头
    const headers: Record<string, string> = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      Accept: '*/*',
    }

    // 如果是豆瓣域名，添加 Referer 头
    if (targetUrl.includes('douban.com') || targetUrl.includes('doubanio.com')) {
      headers['Referer'] = 'https://movie.douban.com/'
      headers['Cookie'] = DOUBAN_BID
      headers['Accept-Language'] = 'zh-CN,zh;q=0.9,en;q=0.8'
    }

    let response = await fetch(targetUrl, {
      headers,
      // 设置超时
      signal: AbortSignal.timeout(15000),
    })

    if (isHtmlResponse(response.headers.get('content-type'))) {
      const challengeBody = await response.clone().text()
      if (looksLikeChallenge(response.status, response.headers.get('content-type'), challengeBody)) {
        const retried = await retryAsPostForm(target, headers)
        if (retried && !looksLikeChallenge(retried.status, retried.headers.get('content-type'), '')) {
          response = retried
        }
      }
    }

    const contentLength = Number(response.headers.get('content-length') ?? '')
    if (Number.isFinite(contentLength) && contentLength > MAX_RESPONSE_BYTES) {
      return new Response(JSON.stringify({ error: 'Response too large' }), {
        status: 413,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...corsHeaders },
      })
    }

    if (isHtmlResponse(response.headers.get('content-type'))) {
      const body = await response.text()
      if (looksLikeHtml(body)) {
        return new Response(JSON.stringify({ error: 'HTML responses are not proxied' }), {
          status: 502,
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...corsHeaders },
        })
      }
      if (body.length > MAX_RESPONSE_BYTES) {
        return new Response(JSON.stringify({ error: 'Response too large' }), {
          status: 413,
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...corsHeaders },
        })
      }
      const plainHeaders = new Headers(response.headers)
      plainHeaders.set('Content-Type', 'text/plain; charset=utf-8')
      Object.entries(corsHeaders).forEach(([key, value]) => plainHeaders.set(key, value))
      plainHeaders.set('Cache-Control', cacheControlFor(plainHeaders.get('Content-Type')))
      return new Response(body, { status: response.status, headers: plainHeaders })
    }

    if (!isAllowedContentType(response.headers.get('content-type'))) {
      return new Response(JSON.stringify({ error: 'Unsupported content type' }), {
        status: 415,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...corsHeaders },
      })
    }

    // Create a new response with the body from the fetch
    const newResponse = new Response(limitBodySize(response.body), response)

    // Add CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      newResponse.headers.set(key, value)
    })

    // 添加缓存头：按内容类型分流，避免把动态 JSON 锁死一整天
    newResponse.headers.set('Cache-Control', cacheControlFor(newResponse.headers.get('Content-Type')))

    return newResponse
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: 'Proxy request failed', message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        ...corsHeaders,
      },
    })
  }
}
