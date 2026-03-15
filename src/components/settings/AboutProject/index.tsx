import { OkiLogo } from '@/components/icons'
import { useVersionStore } from '@/store/versionStore'

import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useSettingStore } from '@/store/settingStore'
import ActionDropdown from '@/components/common/ActionDropdown'
import { usePersonalConfig } from '@/hooks/usePersonalConfig'
import { useRef, useState } from 'react'
import { URLConfigModal, TextConfigModal } from './ImportConfigModal'
import { ConfirmModal } from '@/components/common/ConfirmModal'

export default function AboutProject() {
  const currentYear = new Date().getFullYear()
  const { currentVersion } = useVersionStore()
  const { system, setSystemSettings } = useSettingStore()

  const { exportConfig, exportConfigToText, importConfig, restoreDefault } = usePersonalConfig()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    importConfig(file)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const [urlConfigModalOpen, setUrlConfigModalOpen] = useState(false)
  const [textConfigModalOpen, setTextConfigModalOpen] = useState(false)
  const [confirmRestoreOpen, setConfirmRestoreOpen] = useState(false)

  return (
    <div className="flex flex-col gap-6 px-4 md:px-8">
      {/* Header Section */}
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="transition-all duration-300 hover:scale-105">
          <OkiLogo size={120} className="drop-shadow-sm" />
        </div>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-800 md:text-3xl dark:text-gray-100">
            KAIXIN TV
          </h1>
          <div className="flex items-center gap-2">
            <span className="bg-primary/10 text-primary rounded-full px-3 py-0.5 text-xs font-medium md:text-sm">
              v{currentVersion}
            </span>
          </div>
        </div>
      </div>

      {/* Settings Section */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-row items-center justify-between rounded-lg border border-gray-200 bg-white/40 p-4 transition-all hover:border-gray-300 hover:bg-white/60 hover:shadow-sm dark:border-gray-700 dark:bg-gray-800/40 dark:hover:bg-gray-800/60">
          <div className="space-y-0.5">
            <Label className="text-base text-gray-800 dark:text-gray-100">自动显示更新日志</Label>
            <p className="text-sm text-gray-500">检测到新版本时自动弹出更新说明</p>
          </div>
          <Switch
            checked={system.isUpdateLogEnabled}
            onCheckedChange={checked => setSystemSettings({ isUpdateLogEnabled: checked })}
          />
        </div>

        {/* Personal Config Section */}
        <div className="flex flex-row items-center justify-between rounded-lg border border-gray-200 bg-white/40 p-4 transition-all hover:border-gray-300 hover:bg-white/60 hover:shadow-sm dark:border-gray-700 dark:bg-gray-800/40 dark:hover:bg-gray-800/60">
          <div className="space-y-0.5">
            <Label className="text-base text-gray-800 dark:text-gray-100">个人配置管理</Label>
            <p className="text-sm text-gray-500">导入/导出设置与视频源，或恢复默认</p>
          </div>
          <ActionDropdown
            label="配置操作"
            items={[
              {
                label: '导出个人配置',
                type: 'sub',
                children: [
                  {
                    label: '导出为文件',
                    onClick: exportConfig,
                  },
                  {
                    label: '导出为文本',
                    onClick: exportConfigToText,
                  },
                ],
              },
              {
                label: '导入个人配置',
                type: 'sub',
                children: [
                  {
                    label: '从文件导入',
                    onClick: () => fileInputRef.current?.click(),
                  },
                  {
                    label: '从URL导入',
                    onClick: () => setUrlConfigModalOpen(true),
                  },
                  {
                    label: '从文本导入',
                    onClick: () => setTextConfigModalOpen(true),
                  },
                ],
              },
              {
                label: '恢复默认配置',
                className: 'text-red-600 focus:text-red-600 focus:bg-red-50',
                onClick: () => setConfirmRestoreOpen(true),
              },
            ]}
          />
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".json"
            onChange={handleFileChange}
          />
        </div>
      </div>
      <URLConfigModal open={urlConfigModalOpen} onOpenChange={setUrlConfigModalOpen} />
      <TextConfigModal open={textConfigModalOpen} onOpenChange={setTextConfigModalOpen} />
      <ConfirmModal
        isOpen={confirmRestoreOpen}
        onClose={() => setConfirmRestoreOpen(false)}
        onConfirm={restoreDefault}
        title="确认恢复默认配置？"
        description="此操作将重置所有设置并清除所有已添加的视频源，恢复到初始默认状态。该操作无法撤销。"
        confirmText="确认恢复"
        isDestructive={true}
      />

      {/* Description Section */}
      <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white/40 p-6 backdrop-blur-xl hover:shadow-sm dark:border-gray-700 dark:bg-gray-800/40">
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">关于项目</h2>
        <div className="space-y-2">
          <p className="text-base font-medium leading-relaxed text-gray-800 dark:text-gray-200">
            KAIXIN TV
          </p>
          <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
            聚合多源影视资源，提供流畅观影体验
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              React 19
            </span>
            <span className="inline-flex items-center rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
              TypeScript
            </span>
            <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
              Vite
            </span>
            <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              Tailwind CSS
            </span>
          </div>
        </div>
      </div>

      {/* Legal Disclaimer Section */}
      <div className="flex flex-col gap-4 rounded-xl border border-amber-200 bg-amber-50/40 p-6 backdrop-blur-xl dark:border-amber-800 dark:bg-amber-900/20">
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-lg font-semibold text-amber-800 dark:text-amber-300">法律声明</h2>
        </div>
        <div className="space-y-3 text-sm leading-relaxed text-amber-900/80 dark:text-amber-200/80">
          <p>
            本项目仅供学习交流使用，所有视频内容均来自第三方API接口，本项目不存储、不制作、不上传任何视频文件。
          </p>
          <p>
            本项目开发者不对第三方API的内容、准确性、合法性负责，使用本项目所产生的一切后果由使用者自行承担。
          </p>
          <p>
            请遵守当地法律法规，支持正版内容。如有侵权，请联系第三方API提供者删除相关内容。
          </p>
          <p className="font-medium text-amber-800 dark:text-amber-300">
            使用本项目即表示您已阅读并同意以上声明。
          </p>
        </div>
      </div>

      {/* GitHub Link Section */}
      <div className="flex flex-col items-center gap-3 rounded-xl border border-gray-200 bg-white/40 p-6 backdrop-blur-xl hover:shadow-sm dark:border-gray-700 dark:bg-gray-800/40">
        <h2 className="text-base font-semibold text-gray-700 dark:text-gray-200">开源项目</h2>
        <a
          href="https://github.com/SuperheroerN/KAIXIN_TV"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-lg border border-gray-300 bg-white px-6 py-3 transition-all hover:border-gray-400 hover:shadow-md dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500"
          title="访问 GitHub 仓库"
        >
          <svg className="h-6 w-6 text-gray-800 dark:text-gray-200" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">查看源代码</span>
          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          如果这个项目对你有帮助，请给一个 ⭐ Star 支持一下！
        </p>
      </div>

      {/* Footer Section */}
      <div className="mt-8 flex flex-col items-center gap-2 border-t border-gray-200/50 pt-8 text-center dark:border-gray-700/50">
        <p className="text-sm text-gray-500">© {currentYear} KAIXIN TV. All rights reserved.</p>
        <p className="text-xs text-gray-400">Designed & Built with ❤️ by KAIXIN Team</p>
      </div>
    </div>
  )
}
