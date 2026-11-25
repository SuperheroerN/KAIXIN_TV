import { useEffect } from 'react'
import { formatDocumentTitle, SITE_NAME } from '@/config/site.config'

/**
 * 自定义 Hook：动态更新页面标题
 * @param title - 页面标题（不包含站点名称）
 * @param siteName - 站点名称，默认读取 VITE_SITE_NAME / VITE_SITE_SUBTITLE
 */
export function useDocumentTitle(title: string, siteName: string = SITE_NAME) {
  useEffect(() => {
    const previousTitle = document.title

    document.title = title ? `${title} - ${siteName}` : formatDocumentTitle()

    // 组件卸载时恢复之前的标题
    return () => {
      document.title = previousTitle
    }
  }, [title, siteName])
}
