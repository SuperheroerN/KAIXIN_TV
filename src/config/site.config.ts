/**
 * 站点品牌配置
 * 全部可以通过环境变量覆盖，不用改代码
 */

const env = import.meta.env

export const SITE_NAME = (env.VITE_SITE_NAME || '开心影视').trim()
export const SITE_SUBTITLE = (env.VITE_SITE_SUBTITLE || 'KAIXIN TV').trim()
export const SITE_DESCRIPTION = (
  env.VITE_SITE_DESCRIPTION || '聚合多源影视资源，热门、最新、经典一站直达'
).trim()

/**
 * 浏览器标签页标题
 */
export function formatDocumentTitle(pageTitle?: string): string {
  if (!pageTitle) return SITE_SUBTITLE || SITE_NAME
  return `${pageTitle} - ${SITE_SUBTITLE || SITE_NAME}`
}

export const siteConfig = {
  name: SITE_NAME,
  subtitle: SITE_SUBTITLE,
  description: SITE_DESCRIPTION,
}
