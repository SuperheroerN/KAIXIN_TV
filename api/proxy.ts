import type { VercelRequest, VercelResponse } from '@vercel/node'

async function handleProxyRequest(targetUrl: string): Promise<Response> {
  try {
    new URL(targetUrl)
  } catch {
    throw new Error('Invalid URL format')
  }

  // 设置请求头
  const headers: Record<string, string> = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    Accept: '*/*',
  }

  // 如果是豆瓣域名，添加 Referer 头
  if (targetUrl.includes('douban.com') || targetUrl.includes('doubanio.com')) {
    headers['Referer'] = 'https://movie.douban.com/'
    headers['Accept-Language'] = 'zh-CN,zh;q=0.9,en;q=0.8'
  }

  const response = await fetch(targetUrl, {
    headers,
    signal: AbortSignal.timeout(15000),
  })

  return response
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    const { url } = req.query

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL parameter is required' })
    }

    const targetUrl = decodeURIComponent(url)
    const response = await handleProxyRequest(targetUrl)
    const text = await response.text()
    const contentType = response.headers.get('content-type') || 'application/json'

    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=60')
    res.status(response.status).send(text)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    res.status(500).json({ error: 'Proxy request failed', message })
  }
}
