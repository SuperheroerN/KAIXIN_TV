// 开发期调试日志：生产构建里 import.meta.env.DEV 为 false，整段会被 minifier 剔除
export function log(...args: unknown[]): void {
  if (import.meta.env.DEV) {
    console.log(...args)
  }
}
