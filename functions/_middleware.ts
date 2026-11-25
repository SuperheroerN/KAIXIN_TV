// Cloudflare Pages 中间件：访问密码门
// 未配置 ACCESS_PASSWORD 时整站公开；配置后除静态资源与登录接口外都要带上会话 Cookie
import {
  SESSION_COOKIE,
  isProtectionEnabled,
  readCookie,
  renderLoginPage,
  sanitizeNext,
  verifySessionToken,
  type PagesContext,
} from './_lib/auth'

const PUBLIC_PATHS = new Set(['/api/auth', '/api/logout'])
const ASSET_PATTERN = /\.(?:js|mjs|css|png|jpe?g|gif|svg|webp|avif|ico|woff2?|ttf|otf|map|txt|xml|webmanifest)$/i

export const onRequest = async (context: PagesContext): Promise<Response> => {
  if (!isProtectionEnabled(context.env)) {
    return context.next()
  }

  const url = new URL(context.request.url)
  if (PUBLIC_PATHS.has(url.pathname)) {
    return context.next()
  }

  // 静态资源不进密码门：登录页自身不依赖外部资源，登录后再加载应用
  if (url.pathname.startsWith('/assets/') || ASSET_PATTERN.test(url.pathname)) {
    return context.next()
  }

  const token = readCookie(context.request.headers.get('Cookie'), SESSION_COOKIE)
  if (await verifySessionToken(token, context.env)) {
    return context.next()
  }

  const acceptsHtml = (context.request.headers.get('Accept') ?? '').includes('text/html')
  if (!acceptsHtml) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    })
  }

  return renderLoginPage({ next: sanitizeNext(url.pathname + url.search) })
}
