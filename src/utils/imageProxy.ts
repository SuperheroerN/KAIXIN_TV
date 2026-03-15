/**
 * 图片代理工具
 * 用于解决豆瓣等网站的防盗链问题
 */

/**
 * 获取代理后的图片URL
 * @param imageUrl 原始图片URL
 * @returns 代理后的URL
 */
export function getProxiedImageUrl(imageUrl: string): string {
  if (!imageUrl) return ''
  
  // 统一使用自己的代理服务（开发和生产环境）
  // 这样可以确保豆瓣图片正确显示
  return `/proxy?url=${encodeURIComponent(imageUrl)}`
}

/**
 * 获取占位图URL
 * @param text 占位文字
 * @returns 占位图URL
 */
export function getPlaceholderImageUrl(text: string): string {
  return `https://placehold.jp/300x450.png?text=${encodeURIComponent(text)}`
}

/**
 * 图片加载错误处理
 * @param event 错误事件
 * @param fallbackText 备用文字
 */
export function handleImageError(
  event: React.SyntheticEvent<HTMLImageElement>,
  fallbackText: string
): void {
  const target = event.target as HTMLImageElement
  
  // 如果已经是占位图，不再处理
  if (target.src.includes('placehold.jp')) {
    return
  }
  
  // 如果是代理失败，尝试直接加载原图
  if (target.src.includes('weserv.nl') || target.src.includes('/proxy')) {
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
