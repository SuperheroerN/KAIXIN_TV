import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * 渲染期错误兜底：任意子组件抛错时保住顶栏与外壳，给出刷新/回首页的出口。
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <p className="text-base font-medium text-fg">页面出错了</p>
        <p className="max-w-md text-sm text-muted-fg">刷新一下试试，或者回到首页重新进入。</p>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-full border border-line px-4 py-2 text-sm text-fg-soft transition hover:text-fg"
          >
            刷新页面
          </button>
          <button
            type="button"
            onClick={() => {
              window.location.href = '/'
            }}
            className="rounded-full border border-line px-4 py-2 text-sm text-fg-soft transition hover:text-fg"
          >
            回到首页
          </button>
        </div>
      </div>
    )
  }
}
