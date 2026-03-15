import type { Plugin } from 'vite'
import { handleProxyRequest, getTargetUrl } from '../utils/proxy'

export function proxyMiddleware(): Plugin {
  return {
    name: 'proxy-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/proxy')) {
          return next()
        }

        try {
          const targetUrl = getTargetUrl(req.url)
          const response = await handleProxyRequest(targetUrl)
          
          // 获取内容类型
          const contentType = response.headers.get('content-type') || 'application/octet-stream'
          
          // 设置响应头
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Content-Type', contentType)
          res.setHeader('Cache-Control', 'public, max-age=86400') // 缓存1天
          
          // 根据内容类型处理响应
          if (contentType.includes('image')) {
            // 图片类型，使用buffer
            const buffer = await response.arrayBuffer()
            res.writeHead(response.status)
            res.end(Buffer.from(buffer))
          } else {
            // 文本类型（JSON等）
            const text = await response.text()
            res.writeHead(response.status)
            res.end(text)
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error'
          console.error('❌ [代理错误]', message)
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Proxy request failed', message }))
        }
      })
    },
  }
}
