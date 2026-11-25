// 登录限速：按 CF-Connecting-IP 做固定窗口计数。
// 计数器保存在 Worker 实例内存里，属于减速带而非分布式锁：
// 同一 IP 的连续尝试通常落在同一个实例上，够挡住脚本爆破；
// 要跨机房强一致，需在 Cloudflare 侧加 WAF Rate Limiting 规则（见部署说明）。

const WINDOW_MS = 10 * 60 * 1000
const MAX_FAILURES = 10
const MAX_TRACKED_IPS = 5000

interface Entry {
  count: number
  resetAt: number
}

const failures = new Map<string, Entry>()

function prune(now: number): void {
  if (failures.size < MAX_TRACKED_IPS) return
  for (const [ip, entry] of failures) {
    if (entry.resetAt <= now) failures.delete(ip)
  }
}

export function clientIp(request: Request): string | null {
  return request.headers.get('CF-Connecting-IP')
}

export interface RateLimitState {
  allowed: boolean
  retryAfter: number
}

export function checkLoginRate(ip: string | null): RateLimitState {
  if (!ip) return { allowed: true, retryAfter: 0 }
  const now = Date.now()
  const entry = failures.get(ip)
  if (!entry || entry.resetAt <= now) {
    if (entry) failures.delete(ip)
    return { allowed: true, retryAfter: 0 }
  }
  if (entry.count < MAX_FAILURES) return { allowed: true, retryAfter: 0 }
  return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) }
}

export function recordLoginFailure(ip: string | null): RateLimitState {
  if (!ip) return { allowed: true, retryAfter: 0 }
  const now = Date.now()
  prune(now)

  const entry = failures.get(ip)
  if (!entry || entry.resetAt <= now) {
    failures.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true, retryAfter: 0 }
  }

  entry.count += 1
  if (entry.count < MAX_FAILURES) return { allowed: true, retryAfter: 0 }
  return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) }
}

export function resetLoginFailures(ip: string | null): void {
  if (!ip) return
  failures.delete(ip)
}
