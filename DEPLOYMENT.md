# 🚀 部署指南

本项目只支持 **Cloudflare Pages**：静态资源由 CDN 分发，`/proxy`、`/api/*` 和访问密码门由 Pages Functions 提供。Vercel / Netlify / Docker 适配层已移除（那几套没有边缘鉴权，部署上去站点是公开的）。

---

## 📋 需要准备什么

| 项目 | 说明 |
|------|------|
| GitHub 仓库 | 一个 fork 或你自己的副本 |
| Cloudflare 账号 | 免费账号即可 |
| 视频源地址 | 以 `名称\|URL` 形式配置，见 [环境变量说明](#环境变量说明) |

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

#### 3. 构建配置

```
Framework preset:    Vite
Build command:       pnpm run build   （或 npm run build）
Build output directory: dist
Root directory:      （留空）
Node version:        20
```

构建会先跑 `tsc -b`，再跑 `vite build`。`functions/` 目录不要挪位置，Cloudflare Pages 只认仓库根目录下的 `functions/`。

#### 4. 运行时结构

| 路径 | 由谁处理 | 说明 |
| --- | --- | --- |
| `/proxy` | `functions/proxy.ts` | 图片/豆瓣接口代理，带 SSRF 与 HTML 拦截 |
| `/api/auth` `/api/logout` | `functions/api/*.ts` | 访问密码登录、退出 |
| 其它页面 | `functions/_middleware.ts` → 静态资源 | 开启密码后，未登录的 HTML 请求会收到登录页 |
| `/assets/*`、favicon 等 | 纯 CDN | 由 `public/_routes.json` 排除，不消耗 Functions 调用 |

`public/_headers` 已经配好 CSP、`X-Frame-Options`、`Referrer-Policy` 和静态资源长缓存；`public/_redirects` 负责 SPA 回退到 `index.html`。

#### 5. 环境变量与密钥

**构建期变量**（带 `VITE_` 前缀，会被打进前端包，别放密码）：

```
VITE_INITIAL_VIDEO_SOURCES = 猫眼资源|https://api.maoyanapi.top/api.php/provide/vod,百度资源|https://api.apibdzy.com/api.php/provide/vod,红牛资源|https://www.hongniuzy2.com/api.php/provide/vod,U酷资源|https://api.ukuapi88.com/api.php/provide/vod
VITE_SITE_NAME             = 开心影视
VITE_SITE_SUBTITLE         = KAIXIN TV
```

**运行时密钥**（不带 `VITE_` 前缀，只在 Functions 里可读）：

```
ACCESS_PASSWORD = 你的访问密码        # 不设置则站点公开
AUTH_SECRET     = 一串长随机字符      # 可选，用于签名登录 Cookie
```

设置位置：Pages 项目 → Settings → Variables and Secrets。**构建期变量改完要重新部署**，运行时密钥保存后立即生效。

#### 6. 访问密码是怎么保护的

密码校验发生在边缘（`functions/api/auth.ts`），前端包里没有任何密码或哈希；登录成功后下发 `HttpOnly; Secure; SameSite=Lax` 的 HMAC 签名 Cookie（30 天有效），`functions/_middleware.ts` 对页面请求校验该 Cookie。前端没有密码逻辑，控制台改 localStorage 绕不过去。

#### 6.1 免费额度与 Fail open / closed（重要）

开启密码后，页面请求都会进 Functions；静态资源（`/assets/*`、图标）已由 `_routes.json` 排除，不消耗调用量。Pages Functions 免费额度是每天 10 万次请求，个人站点够用。

额度用尽时的行为在 Pages 控制台设置：**Settings → Runtime → Fail open / closed**。

- **Fail open**（默认）：静态资源照常返回，但 Functions 不再执行 —— 也就是**密码门会失效**，站点变成公开。
- **Fail closed**：直接返回错误页，站点暂时不可用，但不会裸奔。

既然用密码就是为了挡住外人，建议改成 **Fail closed**；只想省事、密码只是"防君子"的话，保持默认即可，但要知道这个边界。

需要更强的防护（多用户、审计日志、SSO、按域名限制）时，用 **Cloudflare Access**：Zero Trust → Access → Applications 新建 Self-hosted 应用指向你的 Pages 域名，Policy 选邮箱域名或一次性 PIN。Access 在请求到达 Functions 之前就拦截，比自建密码门更彻底。

#### 7. 部署与访问

点击 **Save and Deploy**，等待 3-5 分钟，访问 `https://your-project.pages.dev`。

> 豆瓣接口从 Cloudflare 出口 IP 请求时可能被限流或返回 403。站点已内置兜底：豆瓣失败时用视频源的 `ac=videolist` 列表填充首页，且结果有 30 分钟缓存，不会白屏。

### 常见问题

**Q: 白屏怎么办？**
A: 清除浏览器缓存（Ctrl + Shift + Delete），强制刷新（Ctrl + F5）

**Q: 图片不显示？**
A: 确认 Functions 正确部署，检查 `/proxy` 路由是否正常

**Q: 环境变量不生效？**
A: 修改环境变量后需要重新部署（Deployments → Retry deployment）

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
猫眼资源|https://api.maoyanapi.top/api.php/provide/vod,百度资源|https://api.apibdzy.com/api.php/provide/vod,红牛资源|https://www.hongniuzy2.com/api.php/provide/vod,U酷资源|https://api.ukuapi88.com/api.php/provide/vod
```

**格式 2: JSON 格式**
```json
[{"name":"猫眼资源","url":"https://api.maoyanapi.top/api.php/provide/vod","isEnabled":true},{"name":"百度资源","url":"https://api.apibdzy.com/api.php/provide/vod","isEnabled":true},{"name":"红牛资源","url":"https://www.hongniuzy2.com/api.php/provide/vod","isEnabled":true},{"name":"U酷资源","url":"https://api.ukuapi88.com/api.php/provide/vod","isEnabled":true}]
```

### VITE_SOURCE_ORDER（可选）

搜索结果里各个源的先后顺序。不配置时按 `VITE_INITIAL_VIDEO_SOURCES` 里的书写顺序；配置后按这里的顺序排，没写到的源排在最后并保持原顺序。

```
VITE_SOURCE_ORDER=红牛资源,猫眼资源,U酷资源,百度资源
```

可写源名称，也可写源 id（如 `env_source_0`）。这是构建期变量，改完要重新部署。

### ACCESS_PASSWORD（Cloudflare Pages 运行时密钥）

访问密码，**不要加 `VITE_` 前缀**，否则会被打进前端包。只有 Pages Functions 会读取它，前端产物里没有这个值。

---

## 更新部署

1. 推送代码到 GitHub：
```bash
git pull upstream main
git push origin main
```

2. Cloudflare Pages 会自动检测并重新部署（约 1-3 分钟）

> 只改了运行时密钥（`ACCESS_PASSWORD`、`AUTH_SECRET`）不需要重新部署，保存后立即生效；改了 `VITE_*` 构建期变量必须重新部署。

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
