import { type SettingModuleList } from '@/types'
import { motion } from 'framer-motion'
import { cn } from '@/utils'

export default function SideBar({
  activeId,
  modules,
  onSelect,
  className,
}: {
  activeId: string
  modules: SettingModuleList
  onSelect: (id: string) => void
  className?: string
}) {
  return (
    <nav className={cn('flex h-full w-full flex-col gap-1', className)}>
      {modules.map(module => {
        const active = activeId === module.id
        return (
          <button
            key={module.id}
            type="button"
            onClick={() => onSelect(module.id)}
            className={cn(
              'relative flex h-11 items-center gap-2.5 rounded-lg px-3 text-sm transition',
              active
                ? 'font-medium text-brand'
                : 'text-fg-soft hover:bg-surface-2 hover:text-fg',
              module.id === 'about_project' ? 'md:mt-auto' : '',
            )}
          >
            {active && (
              <motion.span
                layoutId="settings-active-bg"
                className="absolute inset-0 -z-10 rounded-lg bg-brand-soft ring-1 ring-brand/25"
                transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              />
            )}
            <span className={cn('relative z-10', active ? 'text-brand' : 'text-muted-fg')}>
              {module.icon}
            </span>
            <span className="relative z-10">{module.name}</span>
          </button>
        )
      })}
    </nav>
  )
}
