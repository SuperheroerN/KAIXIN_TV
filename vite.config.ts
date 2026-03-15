import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { proxyMiddleware } from './src/middleware/proxy.dev'

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [react(), tailwindcss(), proxyMiddleware()],
  build: {
    // 优化构建性能
    rollupOptions: {
      output: {
        manualChunks: {
          // React 核心必须在一起
          'react-vendor': ['react', 'react-dom', 'react/jsx-runtime'],
          // React Router
          'react-router': ['react-router'],
          // UI 库
          'ui-vendor': ['@heroui/react', 'framer-motion'],
          // 播放器
          'player-vendor': ['artplayer', 'hls.js'],
          // Radix UI
          'radix-vendor': ['@radix-ui/react-alert-dialog', '@radix-ui/react-checkbox', '@radix-ui/react-collapsible', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-label', '@radix-ui/react-scroll-area', '@radix-ui/react-select', '@radix-ui/react-separator', '@radix-ui/react-slot', '@radix-ui/react-switch'],
        },
      },
    },
    // 提高 chunk 大小警告限制
    chunkSizeWarningLimit: 1000,
    // 启用 CSS 代码分割
    cssCodeSplit: true,
    // 构建目标
    target: 'es2020',
    // 禁用源码映射以减小体积
    sourcemap: false,
    // 使用 esbuild 压缩
    minify: 'esbuild',
  },
  // 服务器配置
  server: {
    port: 3000,
    strictPort: false,
  },
})
