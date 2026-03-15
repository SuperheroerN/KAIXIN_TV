import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Input, Button } from '@heroui/react'
import { useAuthStore } from '@/store/authStore'
import { OkiLogo } from '@/components/icons'
import { toast } from 'sonner'

interface AuthGuardProps {
  children: React.ReactNode
}

const FAILED_ATTEMPTS_KEY = 'kaixin-tv-failed-attempts'
const LOCKOUT_UNTIL_KEY = 'kaixin-tv-lockout-until'

export default function AuthGuard({ children }: AuthGuardProps) {
  const { login, validateSession } = useAuthStore()
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null)
  const [remainingTime, setRemainingTime] = useState(0)

  const accessPassword = import.meta.env.VITE_ACCESS_PASSWORD
  const isProtectionEnabled = !!accessPassword && accessPassword.trim() !== ''

  useEffect(() => {
    const checkAuth = async () => {
      if (!isProtectionEnabled) {
        setIsAuthenticated(true)
        return
      }
      
      // 检查失败次数和锁定状态
      const attempts = parseInt(localStorage.getItem(FAILED_ATTEMPTS_KEY) || '0')
      const lockout = parseInt(localStorage.getItem(LOCKOUT_UNTIL_KEY) || '0')
      
      setFailedAttempts(attempts)
      
      if (lockout > Date.now()) {
        setLockoutUntil(lockout)
      } else if (lockout > 0) {
        // 锁定时间已过，重置
        localStorage.removeItem(LOCKOUT_UNTIL_KEY)
        localStorage.removeItem(FAILED_ATTEMPTS_KEY)
      }
      
      const isValid = await validateSession()
      setIsAuthenticated(isValid)
    }
    checkAuth()
  }, [validateSession, isProtectionEnabled])

  // 倒计时
  useEffect(() => {
    if (!lockoutUntil) return

    const interval = setInterval(() => {
      const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000)
      
      if (remaining <= 0) {
        setLockoutUntil(null)
        setFailedAttempts(0)
        localStorage.removeItem(LOCKOUT_UNTIL_KEY)
        localStorage.removeItem(FAILED_ATTEMPTS_KEY)
        setRemainingTime(0)
      } else {
        setRemainingTime(remaining)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [lockoutUntil])

  // While checking auth status, show nothing or a loading spinner?
  // Showing nothing avoids flash of content.
  if (isProtectionEnabled && isAuthenticated === null) {
    return null
  }

  // If protection disabled or authenticated, show children
  if (!isProtectionEnabled || isAuthenticated) {
    return <>{children}</>
  }

  const calculateLockoutDuration = (attempts: number): number => {
    // 3次失败：30秒
    // 4次失败：1分钟
    // 5次失败：2分钟
    // 6次失败：5分钟
    // 7次及以上：10分钟
    if (attempts === 3) return 30 * 1000
    if (attempts === 4) return 60 * 1000
    if (attempts === 5) return 2 * 60 * 1000
    if (attempts === 6) return 5 * 60 * 1000
    return 10 * 60 * 1000 // 7次及以上
  }

  const handleLogin = async () => {
    // 检查是否在锁定期
    if (lockoutUntil && lockoutUntil > Date.now()) {
      const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000)
      toast.error(`请等待 ${remaining} 秒后再试`)
      return
    }

    setIsLoading(true)
    // Small artificial delay for better UX
    await new Promise(resolve => setTimeout(resolve, 600))

    const success = await login(password)
    if (success) {
      // 成功，重置失败次数
      localStorage.removeItem(FAILED_ATTEMPTS_KEY)
      localStorage.removeItem(LOCKOUT_UNTIL_KEY)
      setFailedAttempts(0)
      setLockoutUntil(null)
      setIsAuthenticated(true)
      toast.success('验证成功')
    } else {
      // 失败，增加失败次数
      const newAttempts = failedAttempts + 1
      setFailedAttempts(newAttempts)
      localStorage.setItem(FAILED_ATTEMPTS_KEY, newAttempts.toString())

      if (newAttempts >= 3) {
        // 触发锁定
        const lockoutDuration = calculateLockoutDuration(newAttempts)
        const lockoutTime = Date.now() + lockoutDuration
        setLockoutUntil(lockoutTime)
        localStorage.setItem(LOCKOUT_UNTIL_KEY, lockoutTime.toString())
        
        const seconds = Math.ceil(lockoutDuration / 1000)
        toast.error(`密码错误次数过多，请等待 ${seconds} 秒后再试`)
      } else {
        const remaining = 3 - newAttempts
        toast.error(`密码错误，还有 ${remaining} 次机会`)
      }
      
      setPassword('')
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin()
    }
  }

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds} 秒`
    }
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes} 分 ${secs} 秒`
  }

  const isLocked = lockoutUntil && lockoutUntil > Date.now()

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/80 backdrop-blur-3xl"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', duration: 0.6 }}
          className="flex w-[90vw] max-w-md flex-col items-center gap-6 rounded-3xl border border-black/5 bg-white/40 p-8 shadow-2xl backdrop-blur-2xl md:p-12"
        >
          <div className="mb-2">
            <OkiLogo size={80} />
          </div>

          <div className="text-center">
            <h1 className="mb-2 text-2xl font-bold text-gray-900 drop-shadow-sm">
              {isLocked ? '🔒 访问已锁定' : '访问受限'}
            </h1>
            <p className="text-gray-500">
              {isLocked 
                ? `请等待 ${formatTime(remainingTime)} 后再试` 
                : '当前站点通过密码保护，请输入访问密码'}
            </p>
          </div>

          <div className="w-full space-y-4">
            <Input
              type="password"
              placeholder="请输入访问密码"
              value={password}
              onValueChange={setPassword}
              onKeyDown={handleKeyDown}
              size="lg"
              variant="bordered"
              classNames={{
                inputWrapper:
                  'bg-black/5 border-black/10 hover:border-black/20 focus-within:!border-black/40 text-black shadow-inner',
                input: 'text-black placeholder:text-gray-400',
              }}
              isClearable
              isDisabled={!!isLocked}
            />

            {failedAttempts > 0 && !isLocked && (
              <div className="text-center text-sm text-orange-600">
                ⚠️ 已失败 {failedAttempts} 次，{3 - failedAttempts} 次后将被锁定
              </div>
            )}

            {isLocked && (
              <div className="text-center text-sm text-red-600">
                🔒 由于多次输入错误，访问已被暂时锁定
              </div>
            )}

            <Button
              className="w-full bg-black font-bold text-white shadow-lg hover:bg-gray-800"
              size="lg"
              onPress={handleLogin}
              isLoading={isLoading}
              isDisabled={!!isLocked}
            >
              {isLocked ? `等待 ${formatTime(remainingTime)}` : '进入网站'}
            </Button>
          </div>

          <div className="text-center text-xs text-gray-500">
            <p>安全提示：</p>
            <p className="mt-1">连续输错3次将被锁定，锁定时间会递增</p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
