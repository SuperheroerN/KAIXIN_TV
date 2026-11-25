// 退出接口：清除会话 Cookie
import { clearSessionCookie } from '../_lib/auth'

function redirectToHome(): Response {
  return new Response(null, {
    status: 303,
    headers: {
      Location: '/',
      'Set-Cookie': clearSessionCookie(),
      'Cache-Control': 'no-store',
    },
  })
}

export const onRequestGet = async (): Promise<Response> => redirectToHome()

export const onRequestPost = async (): Promise<Response> => redirectToHome()
