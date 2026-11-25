/**
 * 图片代理工具
 * 用于解决豆瓣等网站的防盗链问题
 */

const PLACEHOLDER_SIZE = { width: 300, height: 450 }

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * 获取代理后的图片URL
 * @param imageUrl 原始图片URL
 * @returns 代理后的URL
 */
export function getProxiedImageUrl(imageUrl: string): string {
  if (!imageUrl) return ''

  // 统一使用自己的代理服务（开发和生产环境）
  // 这样可以确保豆瓣等站点的图片正确显示
  return `/proxy?url=${encodeURIComponent(imageUrl)}`
}

/**
 * 获取占位图URL
 * 使用内联 SVG，不依赖外部占位图服务，断网也能显示
 * @param text 占位文字
 * @returns 占位图URL
 */
export function getPlaceholderImageUrl(text: string = '暂无封面'): string {
  const { width, height } = PLACEHOLDER_SIZE
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<rect width="${width}" height="${height}" fill="#1f2937"/>
<g fill="#9ca3af" font-family="system-ui, sans-serif" text-anchor="middle">
<text x="${width / 2}" y="${height / 2}" font-size="20">${escapeXml(text)}</text>
<text x="${width / 2}" y="${height / 2 + 30}" font-size="13" opacity="0.6">NO COVER</text>
</g>
</svg>`

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

/**
 * 图片加载错误处理
 * @param event 错误事件
 * @param fallbackText 备用文字
 */
export function handleImageError(
  event: React.SyntheticEvent<HTMLImageElement>,
  fallbackText: string,
): void {
  const target = event.target as HTMLImageElement

  // 已经是占位图，不再处理
  if (target.src.startsWith('data:image/svg+xml')) {
    return
  }

  // 走代理失败时，先尝试直接加载原图
  if (target.src.includes('/proxy')) {
    const originalUrl = target.getAttribute('data-original-url')
    if (originalUrl && !target.dataset.triedOriginal) {
      target.dataset.triedOriginal = 'true'
      target.src = originalUrl
      return
    }
  }

  // 最后使用占位图
  target.src = getPlaceholderImageUrl(fallbackText)
}
