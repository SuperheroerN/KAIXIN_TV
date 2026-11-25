import { NavLink, useNavigate } from 'react-router'
import { OkiLogo, SettingIcon } from '@/components/icons'
import RecentHistory from '@/components/RecentHistory'
import IconButton from '@/components/ui-kit/IconButton'
import SearchBox from '@/components/ui-kit/SearchBox'
import { useTimeBasedTheme } from '@/hooks/useTimeBasedTheme'
import { cn } from '@/utils'
import { SITE_NAME, SITE_SUBTITLE } from '@/config/site.config'

interface TopBarProps {
  className?: string
  showSearch?: boolean
}

/**
 * 全站顶栏：品牌、搜索、主题切换、观看记录、设置
 */
export default function TopBar({ className, showSearch = true }: TopBarProps) {
  const navigate = useNavigate()
  const { isNightMode, toggleTheme } = useTimeBasedTheme()

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b border-line bg-app/80 backdrop-blur-xl backdrop-saturate-150',
        className,
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-3 px-4 md:gap-5 md:px-6">
        <NavLink to="/" className="flex shrink-0 items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 ring-1 ring-brand/25">
            <OkiLogo size={22} />
          </span>
          <span className="hidden flex-col leading-none sm:flex">
            <span className="text-[15px] font-bold tracking-tight text-fg">{SITE_NAME}</span>
            <span className="mt-0.5 text-[10px] font-medium tracking-[0.18em] text-muted-fg">
              {SITE_SUBTITLE}
            </span>
          </span>
        </NavLink>

        {showSearch ? <SearchBox className="mx-auto max-w-xl" /> : null}

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <IconButton label={isNightMode ? '切换到白天模式' : '切换到夜间模式'} onClick={toggleTheme}>
            {isNightMode ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="4.5" />
                <path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
              </svg>
            )}
          </IconButton>

          <RecentHistory />

          <IconButton label="设置" onClick={() => navigate('/settings')}>
            <SettingIcon size={30} />
          </IconButton>
        </div>
      </div>
    </header>
  )
}
