# 🚀 KAIXIN TV 快速开始指南

> 5分钟快速部署你的影视聚合平台！

## 📋 目录

- [方式一：Cloudflare Pages（推荐，最简单）](#方式一cloudflare-pages推荐最简单)
- [方式二：Vercel（一键部署）](#方式二vercel一键部署)
- [方式三：本地运行](#方式三本地运行)

---

## 方式一：Cloudflare Pages（推荐，最简单）

### 为什么选择 Cloudflare Pages？

✅ **完全免费** - 无限带宽，无限请求  
✅ **无需信用卡** - 注册即可使用  
✅ **全球加速** - 访问速度快  
✅ **自动部署** - 推送代码自动更新  

### 步骤1：准备工作（2分钟）

1. **注册 GitHub 账号**
   - 访问 [github.com](https://github.com)
   - 点击 "Sign up" 注册
   - 验证邮箱

2. **Fork 项目**
   - 访问 [KAIXIN TV 项目](https://github.com/your-username/kaixin-tv)
   - 点击右上角 **Fork** 按钮
   - 等待 Fork 完成

### 步骤2：注册 Cloudflare（1分钟）

1. 访问 [Cloudflare](https://dash.cloudflare.com/sign-up)
2. 输入邮箱和密码
3. 验证邮箱
4. 登录成功

### 步骤3：部署项目（2分钟）

1. **进入 Pages 控制台**
   - 点击左侧 **Workers & Pages**
   - 点击 **Create application**
   - 选择 **Pages** 标签
   - 点击 **Connect to Git**

2. **连接 GitHub**
   - 点击 **Connect GitHub**
   - 授权 Cloudflare
   - 选择 `kaixin-tv` 仓库
   - 点击 **Install & Authorize**

3. **配置项目**
   - **项目名称**：`kaixin-tv`
   - **构建命令**：`pnpm build`
   - **输出目录**：`dist`

4. **添加环境变量**（重要！）
   
   展开 **Environment variables**，添加：
   
   **变量名**：`VITE_INITIAL_VIDEO_SOURCES`  
   **值**：
   ```json
   [{"name":"无尽资源","url":"https://api.wujinapi.me/api.php/provide/vod","isEnabled":true},{"name":"茅台资源","url":"https://caiji.maotaizy.cc/api.php/provide/vod","isEnabled":true},{"name":"猫眼资源","url":"https://api.maoyanapi.top/api.php/provide/vod","isEnabled":true}]
   ```
   
   **可选 - 添加访问密码**：
   
   **变量名**：`VITE_ACCESS_PASSWORD`  
   **值**：`your_password`（改成你的密码）

5. **开始部署**
   - 点击 **Save and Deploy**
   - 等待2-3分钟
   - 看到 **Success!** 表示成功

6. **访问网站**
   - 复制分配的域名（如 `kaixin-tv.pages.dev`）
   - 在浏览器打开
   - 🎉 完成！

### 常见问题

**Q: 部署失败怎么办？**
- 检查环境变量是否正确添加
- 确认 JSON 格式正确（复制粘贴上面的配置）
- 查看构建日志找到错误信息

**Q: 如何更新网站？**
- 在 GitHub 上修改代码
- Cloudflare 会自动检测并重新部署

**Q: 如何修改视频源？**
1. 进入 Cloudflare Pages 控制台
2. 选择项目 → Settings → Environment variables
3. 编辑 `VITE_INITIAL_VIDEO_SOURCES`
4. 保存后重新部署

---

## 方式二：Vercel（一键部署）

### 步骤1：一键部署

点击下方按钮：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/kaixin-tv)

### 步骤2：配置

1. 使用 GitHub 登录 Vercel
2. 授权访问
3. 添加环境变量：
   - `VITE_INITIAL_VIDEO_SOURCES`
   - `VITE_ACCESS_PASSWORD`（可选）
4. 点击 **Deploy**
5. 等待部署完成
6. 访问分配的域名

---

## 方式三：本地运行

### 适合人群

- 开发者
- 想要本地测试
- 需要自定义修改

### 步骤1：安装环境

1. **安装 Node.js**
   - 访问 [nodejs.org](https://nodejs.org/)
   - 下载 LTS 版本（18.x 或更高）
   - 安装并验证：
     ```bash
     node --version
     ```

2. **安装 pnpm**
   ```bash
   npm install -g pnpm
   ```

### 步骤2：克隆项目

```bash
# 克隆项目
git clone https://github.com/your-username/kaixin-tv.git

# 进入目录
cd kaixin-tv

# 安装依赖
pnpm install
```

### 步骤3：配置环境变量

**Windows:**
```bash
copy .env.example .env
```

**Linux/Mac:**
```bash
cp .env.example .env
```

编辑 `.env` 文件，配置视频源。

### 步骤4：启动

**方式1：命令行**
```bash
pnpm dev
```

**方式2：Windows 批处理**
双击 `一键启动.bat`

### 步骤5：访问

打开浏览器访问：`http://localhost:3000`

---

## 🎯 下一步

### 自定义配置

1. **修改视频源**
   - 编辑 `.env` 文件
   - 或在部署平台修改环境变量

2. **设置访问密码**
   - 添加 `VITE_ACCESS_PASSWORD` 环境变量
   - 重新部署

3. **自定义域名**
   - Cloudflare Pages: Settings → Custom domains
   - Vercel: Settings → Domains
   - 添加你的域名

### 进阶功能

- 📖 查看 [详细部署指南](DEPLOYMENT_GUIDE.md)
- 🛠️ 查看 [贡献指南](CONTRIBUTING.md)
- 📚 查看 [README](README.md)

---

## 💡 提示

### 视频源配置

推荐配置3-5个视频源：

```json
[
  {"name":"无尽资源","url":"https://api.wujinapi.me/api.php/provide/vod","isEnabled":true},
  {"name":"茅台资源","url":"https://caiji.maotaizy.cc/api.php/provide/vod","isEnabled":true},
  {"name":"猫眼资源","url":"https://api.maoyanapi.top/api.php/provide/vod","isEnabled":true},
  {"name":"百度资源","url":"https://api.apibdzy.com/api.php/provide/vod","isEnabled":true},
  {"name":"红牛资源","url":"https://www.hongniuzy2.com/api.php/provide/vod","isEnabled":true}
]
```

### 访问密码

设置密码后的防暴力破解机制：
- 3次失败 → 锁定30秒
- 4次失败 → 锁定1分钟
- 5次失败 → 锁定2分钟
- 6次及以上 → 锁定时间递增

### 豆瓣推荐

首页会显示豆瓣电影推荐，支持多种分类：
- 热门、最新、经典、豆瓣高分
- 电影类型：动作、喜剧、爱情、科幻等
- 地区：华语、欧美、韩国、日本
- 电视剧：美剧、英剧、韩剧、日剧等

---

## 🆘 需要帮助？

### 遇到问题？

1. **查看文档**
   - [详细部署指南](DEPLOYMENT_GUIDE.md)
   - [常见问题](DEPLOYMENT_GUIDE.md#常见问题)

2. **检查日志**
   - 浏览器控制台（F12）
   - 部署平台构建日志

3. **寻求帮助**
   - [GitHub Issues](https://github.com/your-username/kaixin-tv/issues)
   - [GitHub Discussions](https://github.com/your-username/kaixin-tv/discussions)

### 提问模板

```
**问题描述**：
简要描述你遇到的问题

**部署平台**：
Cloudflare Pages / Vercel / Netlify / 本地

**错误信息**：
粘贴错误信息或截图

**环境变量**：
（隐藏敏感信息）
VITE_INITIAL_VIDEO_SOURCES=[...]
VITE_ACCESS_PASSWORD=***

**浏览器控制台**：
粘贴控制台错误信息
```

---

## 🎉 部署成功！

恭喜你成功部署了 KAIXIN TV！

### 接下来

- ⭐ 给项目点个 Star
- 📢 分享给朋友
- 🐛 报告问题
- 💡 提出建议
- 🤝 贡献代码

---

<div align="center">

**祝你使用愉快！** 🎬

Made with ❤️ by KAIXIN TV Team

[返回首页](README.md) | [详细指南](DEPLOYMENT_GUIDE.md) | [贡献指南](CONTRIBUTING.md)

</div>
