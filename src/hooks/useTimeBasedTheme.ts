import { useEffect, useState } from 'react'

/**
 * 手动切换白天/晚上背景主题
 */
export function useTimeBasedTheme() {
  const [isNightMode, setIsNightMode] = useState(() => {
    // 从 localStorage 读取用户偏好
    const saved = localStorage.getItem('theme-mode')
    return saved === 'night'
  })

  useEffect(() => {
    if (isNightMode) {
      document.body.classList.add('night-mode')
    } else {
      document.body.classList.remove('night-mode')
    }
    // 保存到 localStorage
    localStorage.setItem('theme-mode', isNightMode ? 'night' : 'day')
  }, [isNightMode])

  const toggleTheme = () => {
    setIsNightMode(prev => !prev)
  }

  return { isNightMode, toggleTheme }
}
