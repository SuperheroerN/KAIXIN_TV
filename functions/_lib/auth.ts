// Cloudflare Pages 边缘鉴权公共逻辑
// 密码只存在于 Pages 的运行时环境变量（ACCESS_PASSWORD）里，不会进入前端产物

export interface PagesEnv {
  // 站点访问密码；未设置时站点公开
  ACCESS_PASSWORD?: string
  // 可选的签名密钥；未设置时由访问密码派生
  AUTH_SECRET?: string
}

export interface PagesContext {
  request: Request
  env: PagesEnv
  next: () => Promise<Response>
  params: Record<string, string>
}

export const SESSION_COOKIE = 'kx_auth'
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30

const encoder = new TextEncoder()

function base64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function sign(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message))
  return base64Url(new Uint8Array(signature))
}

function secretOf(env: PagesEnv): string {
  const explicit = env.AUTH_SECRET?.trim()
  if (explicit) return explicit
  return `kx-session:${env.ACCESS_PASSWORD?.trim() ?? ''}`
}

export function isProtectionEnabled(env: PagesEnv): boolean {
  return !!env.ACCESS_PASSWORD && env.ACCESS_PASSWORD.trim() !== ''
}

export async function createSessionToken(env: PagesEnv): Promise<string> {
  const expires = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE
  const signature = await sign(secretOf(env), String(expires))
  return `${expires}.${signature}`
}

export async function verifySessionToken(
  token: string | undefined,
  env: PagesEnv,
): Promise<boolean> {
  if (!token) return false

  const [expiresRaw, signature] = token.split('.')
  const expires = Number(expiresRaw)
  if (!Number.isFinite(expires) || !signature) return false
  if (expires * 1000 < Date.now()) return false

  const expected = await sign(secretOf(env), String(expires))
  return timingSafeEqual(signature, expected)
}

export function timingSafeEqual(a: string, b: string): boolean {
  const aBytes = encoder.encode(a)
  const bBytes = encoder.encode(b)
  let diff = aBytes.length ^ bBytes.length
  const length = Math.max(aBytes.length, bBytes.length)

  for (let i = 0; i < length; i++) {
    diff |= (aBytes[i] ?? 0) ^ (bBytes[i] ?? 0)
  }

  return diff === 0
}

export function readCookie(header: string | null, name: string): string | undefined {
  if (!header) return undefined

  for (const part of header.split(';')) {
    const index = part.indexOf('=')
    if (index === -1) continue
    if (part.slice(0, index).trim() !== name) continue
    return decodeURIComponent(part.slice(index + 1).trim())
  }

  return undefined
}

export function sessionCookie(token: string): string {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}`
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
}

export function sanitizeNext(next: string | null | undefined): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return '/'
  return next
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function renderLoginPage(
  options: { next?: string; error?: string; status?: number; retryAfter?: number } = {},
): Response {
  const next = escapeHtml(sanitizeNext(options.next))
  const error = options.error
    ? `<p class="error" role="alert">${escapeHtml(options.error)}</p>`
    : ''

  const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="robots" content="noindex" />
<title>访问受限 · 开心影视</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
    background: #08090c; color: #f4f5f7; padding: 24px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  }
  .card {
    width: 100%; max-width: 380px; background: #12141a; border: 1px solid rgba(255,255,255,.08);
    border-radius: 18px; padding: 32px 28px; box-shadow: 0 24px 60px -30px rgba(0,0,0,.9);
  }
  .brand { display: flex; align-items: center; gap: 10px; margin-bottom: 22px; }
  .mark {
    width: 36px; height: 36px; border-radius: 10px; background: #ff3b4e;
    display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 18px; color: #fff;
  }
  .name { font-size: 17px; font-weight: 600; letter-spacing: .02em; }
  .sub { margin: 0 0 18px; font-size: 13px; color: #8b94a3; }
  label { display: block; font-size: 12px; color: #8b94a3; margin-bottom: 6px; }
  input[type=password] {
    width: 100%; padding: 12px 14px; font-size: 15px; color: #f4f5f7; background: #0d0f14;
    border: 1px solid rgba(255,255,255,.1); border-radius: 10px; outline: none;
  }
  input[type=password]:focus { border-color: rgba(255,59,78,.6); }
  button {
    width: 100%; margin-top: 16px; padding: 12px 14px; font-size: 15px; font-weight: 600; color: #fff;
    background: #ff3b4e; border: 0; border-radius: 10px; cursor: pointer;
  }
  button:hover { opacity: .92; }
  .error { margin: 14px 0 0; font-size: 13px; color: #ff8a95; }
  .tip { margin: 22px 0 0; font-size: 12px; color: #6b7280; text-align: center; }
</style>
</head>
<body>
  <main class="card">
    <div class="brand">
      <span class="mark">开</span>
      <span class="name">开心影视</span>
    </div>
    <p class="sub">本站已开启访问保护，请输入访问密码。</p>
    <form method="post" action="/api/auth">
      <input type="hidden" name="next" value="${next}" />
      <label for="password">访问密码</label>
      <input id="password" name="password" type="password" autocomplete="current-password" required autofocus />
      <button type="submit">进入网站</button>
      ${error}
    </form>
    <p class="tip">密码由站点管理员设置</p>
  </main>
</body>
</html>`

  const headers: Record<string, string> = {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Content-Security-Policy':
      "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
  }

  if (options.retryAfter) headers['Retry-After'] = String(options.retryAfter)

  return new Response(html, { status: options.status ?? 401, headers })
}
