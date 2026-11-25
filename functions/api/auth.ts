// 登录接口：密码在 Pages 运行时校验，成功后下发签名 Cookie
import {
  createSessionToken,
  isProtectionEnabled,
  renderLoginPage,
  sanitizeNext,
  sessionCookie,
  timingSafeEqual,
  type PagesContext,
} from '../_lib/auth'
import { checkLoginRate, clientIp, recordLoginFailure, resetLoginFailures } from '../_lib/rateLimit'

export const onRequestPost = async (context: PagesContext): Promise<Response> => {
  const { request, env } = context

  if (!isProtectionEnabled(env)) {
    return new Response(null, { status: 303, headers: { Location: '/' } })
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return renderLoginPage({ error: '请求格式不正确，请重试' })
  }

  const next = sanitizeNext(String(form.get('next') ?? '/'))
  const submitted = String(form.get('password') ?? '')
  const ip = clientIp(request)

  const gate = checkLoginRate(ip)
  if (!gate.allowed) {
    return renderLoginPage({
      next,
      error: `尝试次数过多，请 ${Math.ceil(gate.retryAfter / 60)} 分钟后再试`,
      status: 429,
      retryAfter: gate.retryAfter,
    })
  }

  if (!timingSafeEqual(submitted, env.ACCESS_PASSWORD!.trim())) {
    const after = recordLoginFailure(ip)
    // 轻微延迟，降低脚本暴力尝试的速度
    await new Promise(resolve => setTimeout(resolve, 400))
    if (!after.allowed) {
      return renderLoginPage({
        next,
        error: `尝试次数过多，请 ${Math.ceil(after.retryAfter / 60)} 分钟后再试`,
        status: 429,
        retryAfter: after.retryAfter,
      })
    }
    return renderLoginPage({ next, error: '密码不正确，请重试' })
  }

  resetLoginFailures(ip)

  const token = await createSessionToken(env)

  return new Response(null, {
    status: 303,
    headers: {
      Location: next,
      'Set-Cookie': sessionCookie(token),
      'Cache-Control': 'no-store',
    },
  })
}

export const onRequestGet = async (): Promise<Response> =>
  new Response(null, { status: 303, headers: { Location: '/' } })
