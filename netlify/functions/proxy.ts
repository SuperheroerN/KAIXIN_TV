import type { Handler, HandlerEvent } from '@netlify/functions'

const handler: Handler = async (event: HandlerEvent) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    }
  }

  const { url } = event.queryStringParameters || {}

  if (!url) {
    return {
      statusCode: 400,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'URL parameter is required' }),
    }
  }

  try {
    new URL(url) // Validate URL

    // 设置请求头
    const headers: Record<string, string> = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      Accept: '*/*',
    }

    // 如果是豆瓣域名，添加 Referer 头
    if (url.includes('douban.com') || url.includes('doubanio.com')) {
      headers['Referer'] = 'https://movie.douban.com/'
      headers['Accept-Language'] = 'zh-CN,zh;q=0.9,en;q=0.8'
    }

    const response = await fetch(url, {
      headers,
    })

    const text = await response.text()
    const contentType = response.headers.get('content-type') || 'application/json'

    return {
      statusCode: response.status,
      headers: {
        ...headers,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
      body: text,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Proxy request failed', message }),
    }
  }
}

export { handler }
