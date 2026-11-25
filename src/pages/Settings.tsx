import SideBar from '@/components/settings/layouts/SideBar'
import ModuleContent from '@/components/settings/layouts/ModuleContent'
import { useState } from 'react'
import { type SettingModuleList } from '@/types'
import { ListVideo, Info, ArrowLeft, Globe, Search, Play } from 'lucide-react'
import VideoSource from '@/components/settings/VideoSource'
import NetworkSettings from '@/components/settings/NetworkSettings'
import SearchSettings from '@/components/settings/SearchSettings'
import PlaybackSettings from '@/components/settings/PlaybackSettings'
import AboutProject from '@/components/settings/AboutProject'
import { useNavigate } from 'react-router'
import { cn } from '@/utils'

export default function SettingsPage() {
  const navigate = useNavigate()

  const SideBarModules: SettingModuleList = [
    { id: 'video_source', name: '视频源管理', icon: <ListVideo size={17} />, component: <VideoSource /> },
    { id: 'network_settings', name: '网络设置', icon: <Globe size={17} />, component: <NetworkSettings /> },
    { id: 'search_settings', name: '搜索设置', icon: <Search size={17} />, component: <SearchSettings /> },
    { id: 'playback_settings', name: '播放设置', icon: <Play size={17} />, component: <PlaybackSettings /> },
    { id: 'about_project', name: '关于', icon: <Info size={17} />, component: <AboutProject /> },
  ]

  const [activeId, setActiveId] = useState(SideBarModules[0].id)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const currentModule = SideBarModules.find(module => module.id === activeId) || SideBarModules[0]

  return (
    <div className="pt-5 pb-16">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm text-fg-soft transition hover:border-line-strong hover:text-fg"
          >
            <ArrowLeft size={14} /> 返回
          </button>
          <h1 className="text-lg font-semibold tracking-tight text-fg sm:text-xl">设置</h1>
        </div>

        <button
          type="button"
          onClick={() => setIsSidebarOpen(open => !open)}
          className="flex h-9 items-center gap-1.5 rounded-full border border-line px-3 text-sm text-fg-soft transition hover:text-fg md:hidden"
        >
          {currentModule.name}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-[210px_minmax(0,1fr)]">
        <aside
          className={cn(
            'overflow-hidden transition-all duration-300 md:block',
            isSidebarOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 md:max-h-none md:opacity-100',
          )}
        >
          <SideBar
            className="rounded-xl border border-line bg-surface p-2"
            activeId={activeId}
            modules={SideBarModules}
            onSelect={id => {
              setActiveId(id)
              setIsSidebarOpen(false)
            }}
          />
        </aside>

        <div className="min-h-[70vh] min-w-0 rounded-xl border border-line bg-surface p-4 sm:p-6">
          <ModuleContent module={currentModule} />
        </div>
      </div>
    </div>
  )
}
