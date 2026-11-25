import { useNavigate } from 'react-router'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center gap-3 py-24 text-center">
      <p className="text-4xl font-semibold tracking-tight text-fg">404</p>
      <p className="text-base font-medium text-fg">这个页面不存在</p>
      <p className="max-w-md text-sm text-muted-fg">链接可能拼错了，或者内容已经被删除。</p>
      <button
        type="button"
        onClick={() => navigate('/')}
        className="mt-2 rounded-full border border-line px-4 py-2 text-sm text-fg-soft transition hover:text-fg"
      >
        回到首页
      </button>
    </div>
  )
}
