# KAIXIN TV 🎬

<div align="center">

一个现代化的在线影视聚合平台，基于 React + TypeScript 构建

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646cff.svg)](https://vitejs.dev/)

[在线演示](https://your-demo-url.com) | [快速开始](QUICKSTART.md) | [部署指南](DEPLOYMENT.md) | [贡献指南](CONTRIBUTING.md)

</div>

## ✨ 项目简介

KAIXIN TV 是一个基于 [OuonnkiTV](https://github.com/ouonnki/OuonnkiTV) 二次开发的现代化影视聚合平台。项目采用最新的前端技术栈，提供流畅的用户体验和丰富的功能特性。

### 🎯 核心特性

- 🎨 **现代化UI** - 基于 HeroUI 组件库，支持深色/浅色主题切换
- 🔍 **智能搜索** - 多源聚合搜索，自动去重，按优先级排序
- 🎬 **豆瓣推荐** - 首页集成豆瓣电影API，提供高质量内容推荐
- 🔐 **访问控制** - 可选的密码保护，支持防暴力破解
- 📱 **响应式设计** - 完美适配桌面端和移动端
- ⚡ **性能优化** - 代码分割、懒加载、缓存优化
- 🌐 **多源支持** - 支持配置多个视频源，环境变量统一管理
- 🎭 **播放历史** - 自动记录观看历史，支持继续播放

### 🆚 相比原项目的改进

| 特性 | 原项目 | KAIXIN TV |
|------|--------|-----------|
| 首页推荐 | 无 | ✅ 豆瓣API推荐 |
| 主题切换 | 自动 | ✅ 手动切换 + 全局样式 |
| 访问控制 | 基础密码 | ✅ 防暴力破解 |
| 搜索排序 | 随机 | ✅ 按源优先级排序 |
| 视频源管理 | 手动添加 | ✅ 环境变量 + 只读显示 |
| 代理支持 | 基础 | ✅ 图片代理 + 防盗链 |
| 分类导航 | 简单 | ✅ 下拉菜单 + 分组 |
| 品牌定制 | OuonnkiTV | ✅ KAIXIN TV |

## 🚀 快速开始

想要快速部署？查看 [5分钟快速开始指南](QUICKSTART.md)！

### 环境要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0 (推荐) 或 npm/yarn

### 本地开发

```bash
# 1. 克隆项目
git clone https://github.com/your-username/kaixin-tv.git
cd kaixin-tv

# 2. 安装依赖
pnpm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置视频源

# 4. 启动开发服务器
pnpm dev

# 5. 打开浏览器访问
# http://localhost:3000
```

### Windows 用户

双击 `一键启动.bat` 即可快速启动开发服务器。

### 在线部署

查看 [详细部署指南](DEPLOYMENT_GUIDE.md) 了解如何部署到：
- Cloudflare Pages（推荐）
- Vercel
- Netlify
- Docker

## 📦 部署指南

### 快速部署

🚀 **新手推荐**：查看 [5分钟快速开始指南](QUICKSTART.md)

📚 **详细教程**：查看 [完整部署指南](DEPLOYMENT_GUIDE.md)

### Cloudflare Pages (推荐)

1. Fork 本项目到你的 GitHub
2. 登录 [Cloudflare Pages](https://pages.cloudflare.com/)
3. 创建新项目，连接你的 GitHub 仓库
4. 配置构建设置：
   - **构建命令**: `pnpm build`
   - **输出目录**: `dist`
   - **Node 版本**: `18`
5. 添加环境变量（可选）：
   ```
   VITE_INITIAL_VIDEO_SOURCES=[...]
   VITE_ACCESS_PASSWORD=your_password
   ```
6. 部署完成！

### Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/kaixin-tv)

1. 点击上方按钮一键部署
2. 或手动部署：
   ```bash
   pnpm build
   vercel --prod
   ```

### Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/your-username/kaixin-tv)

### Docker

```bash
# 构建镜像
docker build -t kaixin-tv .

# 运行容器
docker run -d -p 3000:80 \
  -e VITE_INITIAL_VIDEO_SOURCES='[...]' \
  -e VITE_ACCESS_PASSWORD='your_password' \
  kaixin-tv
```

或使用 Docker Compose：

```bash
docker-compose up -d
```

## ⚙️ 配置说明

### 视频源配置

在 `.env` 文件中配置视频源：

```env
VITE_INITIAL_VIDEO_SOURCES=[
  {"name":"无尽资源","url":"https://api.wujinapi.me/api.php/provide/vod","isEnabled":true},
  {"name":"茅台资源","url":"https://caiji.maotaizy.cc/api.php/provide/vod","isEnabled":true},
  {"name":"猫眼资源","url":"https://api.maoyanapi.top/api.php/provide/vod","isEnabled":true}
]
```

### 访问密码（可选）

```env
# 留空表示公开访问
VITE_ACCESS_PASSWORD=

# 设置密码保护
VITE_ACCESS_PASSWORD=your_password_here
```

设置密码后，访问网站需要输入密码，支持防暴力破解：
- 3次失败 → 锁定30秒
- 4次失败 → 锁定1分钟
- 5次失败 → 锁定2分钟
- 6次及以上 → 锁定时间递增

## 🛠️ 技术栈

### 前端框架
- **React 18.3** - UI 框架
- **TypeScript 5.6** - 类型安全
- **Vite 6.0** - 构建工具

### UI 组件
- **HeroUI** - 组件库
- **Tailwind CSS** - 样式框架
- **Framer Motion** - 动画库

### 状态管理
- **Zustand** - 轻量级状态管理
- **Zustand Persist** - 状态持久化

### 路由
- **React Router 7** - 路由管理

### 视频播放
- **Artplayer** - 视频播放器
- **HLS.js** - HLS 流支持

### 其他
- **Sonner** - Toast 通知
- **UUID** - 唯一标识生成

## 📁 项目结构

```
kaixin-tv/
├── src/
│   ├── components/      # 组件
│   │   ├── icons/       # 图标组件
│   │   ├── settings/    # 设置相关组件
│   │   └── ui/          # UI 基础组件
│   ├── config/          # 配置文件
│   ├── hooks/           # 自定义 Hooks
│   ├── middleware/      # 中间件（代理等）
│   ├── pages/           # 页面组件
│   ├── services/        # API 服务
│   ├── store/           # 状态管理
│   ├── styles/          # 样式文件
│   ├── types/           # TypeScript 类型
│   └── utils/           # 工具函数
├── public/              # 静态资源
├── .env.example         # 环境变量示例
├── docker-compose.yml   # Docker Compose 配置
├── Dockerfile           # Docker 配置
├── package.json         # 项目依赖
└── vite.config.ts       # Vite 配置
```

## 🤝 贡献指南

欢迎贡献代码、报告问题或提出建议！

### 贡献流程

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 开发规范

- 遵循 ESLint 规则
- 使用 TypeScript 类型注解
- 组件使用函数式组件 + Hooks
- 提交信息遵循 [Conventional Commits](https://www.conventionalcommits.org/)

## 📝 开发计划

- [ ] 支持更多视频源
- [ ] 添加收藏功能
- [ ] 支持多用户系统
- [ ] 移动端 App
- [ ] 离线下载功能
- [ ] 弹幕支持
- [ ] 社交分享功能
- [ ] 观看进度云同步
- [ ] 字幕支持
- [ ] 倍速播放

## 🔧 常见问题

### 视频源相关

**Q: 如何添加新的视频源？**

在 `.env` 文件中修改 `VITE_INITIAL_VIDEO_SOURCES`，添加新的源：
```json
[
  {"name":"源名称","url":"API地址","isEnabled":true}
]
```

**Q: 为什么搜索不到某些视频？**

可能原因：
1. 视频源不支持搜索功能
2. 视频源暂时不可用
3. 网络连接问题

解决方法：
- 尝试其他视频源
- 检查浏览器控制台错误
- 更换网络环境

### 部署相关

**Q: Cloudflare Pages 部署失败？**

常见原因：
1. 构建命令错误 - 确保使用 `pnpm build`
2. 环境变量未配置 - 检查 `VITE_INITIAL_VIDEO_SOURCES`
3. Node 版本过低 - 使用 Node 18+

**Q: 如何更新已部署的网站？**

1. 在 GitHub 上修改代码
2. 推送到仓库
3. 部署平台自动检测并重新部署

### 功能相关

**Q: 如何取消访问密码？**

删除或留空 `.env` 中的 `VITE_ACCESS_PASSWORD`，然后重新部署。

**Q: 忘记访问密码怎么办？**

进入部署平台控制台，查看或修改 `VITE_ACCESS_PASSWORD` 环境变量。

**Q: 豆瓣推荐不显示？**

可能原因：
1. 网络问题 - 豆瓣API需要稳定网络
2. 代理失败 - 检查浏览器控制台
3. API限流 - 稍后再试

更多问题请查看 [详细部署指南](DEPLOYMENT_GUIDE.md)

## 🙏 致谢

- 原项目：[OuonnkiTV](https://github.com/ouonnki/OuonnkiTV)
- 豆瓣电影 API
- 所有贡献者

## 📄 开源协议

本项目基于 [MIT License](LICENSE) 开源。

## ⚠️ 免责声明

本项目仅供学习交流使用，所有视频内容均来自第三方API，本项目不存储任何视频文件。请遵守当地法律法规，支持正版。

## 📮 联系方式

- 项目主页：[GitHub](https://github.com/your-username/kaixin-tv)
- 问题反馈：[Issues](https://github.com/your-username/kaixin-tv/issues)
- 讨论交流：[Discussions](https://github.com/your-username/kaixin-tv/discussions)

---

<div align="center">

**如果这个项目对你有帮助，请给一个 ⭐️ Star 支持一下！**

Made with ❤️ by KAIXIN TV Team

</div>
