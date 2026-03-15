# 🚀 部署指南

本文档介绍如何将 KAIXIN TV 部署到各种平台。

## 📋 快速选择

| 平台 | 难度 | 费用 | 推荐度 | 适合人群 |
|------|------|------|--------|----------|
| [Cloudflare Pages](#cloudflare-pages) | ⭐ | 免费 | ⭐⭐⭐⭐⭐ | 所有人 |
| [Vercel](#vercel) | ⭐ | 免费 | ⭐⭐⭐⭐ | 开发者 |
| [Netlify](#netlify) | ⭐ | 免费 | ⭐⭐⭐ | 开发者 |
| [Docker](#docker) | ⭐⭐⭐ | 自定 | ⭐⭐⭐⭐ | 有服务器 |

---

## Cloudflare Pages

### 优势
- ✅ 完全免费，无限带宽
- ✅ 全球 CDN，访问速度快
- ✅ 自动部署，推送即更新
- ✅ 免费 SSL，自动 HTTPS

### 部署步骤

#### 1. Fork 项目
1. 访问 [GitHub 项目](https://github.com/SuperheroerN/KAIXIN_TV)
2. 点击右上角 **Fork** 按钮

#### 2. 连接 Cloudflare
1. 访问 [Cloudflare Pages](https://pages.cloudflare.com/)
2. 登录或注册账号
3. 点击 **Create a project**
4. 选择 **Connect to Git**
5. 授权 GitHub 并选择你 Fork 的仓库

#### 3. 配置构建
```
Framework preset: Vite
Build command: pnpm run build
Build output directory: dist
Root directory: (留空)
Node version: 20
```

#### 4. 配置环境变量（可选）

在 **Environment variables** 添加：

**视频源配置**（推荐简单格式）：
```
变量名: VITE_INITIAL_VIDEO_SOURCES
变量值: 无尽资源|https://api.wujinapi.me/api.php/provide/vod,茅台资源|https://caiji.maotaizy.cc/api.php/provide/vod,猫眼资源|https://api.maoyanapi.top/api.php/provide/vod
```

**访问密码**（可选）：
```
变量名: VITE_ACCESS_PASSWORD
变量值: your_password
```
留空表示公开访问。

#### 5. 部署
点击 **Save and Deploy**，等待 3-5 分钟。

#### 6. 访问
部署完成后，访问 `https://your-project.pages.dev`

### 常见问题

**Q: 白屏怎么办？**
A: 清除浏览器缓存（Ctrl + Shift + Delete），强制刷新（Ctrl + F5）

**Q: 图片不显示？**
A: 确认 Functions 正确部署，检查 `/proxy` 路由是否正常

**Q: 环境变量不生效？**
A: 修改环境变量后需要重新部署（Deployments → Retry deployment）

---

## Vercel

### 部署步骤

#### 1. 导入项目
1. 访问 [Vercel](https://vercel.com)
2. 点击 **New Project**
3. 导入你 Fork 的 GitHub 仓库

#### 2. 配置
```
Framework Preset: Vite
Build Command: pnpm run build
Output Directory: dist
Install Command: pnpm install
```

#### 3. 环境变量
同 Cloudflare Pages 配置

#### 4. 部署
点击 **Deploy**

---

## Netlify

### 部署步骤

#### 1. 导入项目
1. 访问 [Netlify](https://netlify.com)
2. 点击 **Add new site** → **Import an existing project**
3. 选择 GitHub 并授权

#### 2. 配置
```
Build command: pnpm run build
Publish directory: dist
```

#### 3. 环境变量
在 **Site settings** → **Environment variables** 添加配置

#### 4. 部署
点击 **Deploy site**

---

## Docker

### 使用 Docker Compose（推荐）

#### 1. 克隆项目
```bash
git clone https://github.com/SuperheroerN/KAIXIN_TV.git
cd KAIXIN_TV
```

#### 2. 配置环境变量
复制 `.env.example` 为 `.env`：
```bash
cp .env.example .env
```

编辑 `.env` 文件：
```env
VITE_INITIAL_VIDEO_SOURCES=无尽资源|https://api.wujinapi.me/api.php/provide/vod,茅台资源|https://caiji.maotaizy.cc/api.php/provide/vod
VITE_ACCESS_PASSWORD=
```

#### 3. 启动
```bash
docker-compose up -d
```

#### 4. 访问
打开浏览器访问 `http://localhost:3000`

### 使用 Dockerfile

```bash
# 构建镜像
docker build -t kaixin-tv .

# 运行容器
docker run -d -p 3000:80 \
  -e VITE_INITIAL_VIDEO_SOURCES="无尽资源|https://api.wujinapi.me/api.php/provide/vod" \
  kaixin-tv
```

---

## 环境变量说明

### VITE_INITIAL_VIDEO_SOURCES

预配置的视频源，支持两种格式：

**格式 1: 简单格式（推荐）**
```
名称1|URL1,名称2|URL2,名称3|URL3
```

示例：
```
无尽资源|https://api.wujinapi.me/api.php/provide/vod,茅台资源|https://caiji.maotaizy.cc/api.php/provide/vod
```

**格式 2: JSON 格式**
```json
[{"name":"无尽资源","url":"https://api.wujinapi.me/api.php/provide/vod","isEnabled":true}]
```

### VITE_ACCESS_PASSWORD

访问密码，留空表示公开访问。

---

## 更新部署

### Cloudflare Pages / Vercel / Netlify

1. 在你的 GitHub 仓库中拉取最新代码：
```bash
git pull upstream main
git push origin main
```

2. 平台会自动检测并重新部署

### Docker

```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker-compose up -d --build
```

---

## 故障排除

### 构建失败

1. 检查 Node 版本是否为 20
2. 查看完整构建日志
3. 确认 `package.json` 和 `pnpm-lock.yaml` 完整

### 白屏问题

1. 清除浏览器缓存
2. 检查浏览器控制台错误
3. 确认资源文件正确加载

### 图片不显示

1. 检查代理服务是否正常
2. 查看 Network 标签的 `/proxy` 请求
3. 确认 Functions 正确部署

### 环境变量不生效

1. 确认格式正确（使用 `|` 和 `,`）
2. 修改后重新部署
3. 清除浏览器缓存

---

## 获取帮助

- 📖 查看 [快速开始指南](QUICKSTART.md)
- 🐛 提交 [Issue](https://github.com/SuperheroerN/KAIXIN_TV/issues)
- 💬 参与 [Discussions](https://github.com/SuperheroerN/KAIXIN_TV/discussions)

---

**祝部署顺利！** 🎉
