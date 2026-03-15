# Cloudflare Pages 环境变量配置指南

## 🎯 推荐配置方式（简单格式）

在 Cloudflare Pages 中，使用简单格式配置视频源最可靠。

### 配置步骤

1. **进入 Cloudflare Pages 控制台**
   - 选择你的项目
   - 点击 Settings → Environment variables

2. **添加环境变量**
   
   **变量名称：**
   ```
   VITE_INITIAL_VIDEO_SOURCES
   ```
   
   **变量值（简单格式）：**
   ```
   无尽资源|https://api.wujinapi.me/api.php/provide/vod,茅台资源|https://caiji.maotaizy.cc/api.php/provide/vod,猫眼资源|https://api.maoyanapi.top/api.php/provide/vod,百度资源|https://api.apibdzy.com/api.php/provide/vod,红牛资源|https://www.hongniuzy2.com/api.php/provide/vod
   ```

3. **格式说明**
   - 使用 `|` 分隔名称和 URL
   - 使用 `,` 分隔多个源
   - 格式：`名称1|URL1,名称2|URL2,名称3|URL3`

4. **保存并重新部署**
   - 点击 Save
   - 进入 Deployments
   - 点击 Retry deployment

---

## 📝 可选配置方式（JSON格式）

如果简单格式不工作，可以尝试 JSON 格式：

**变量值（JSON格式，必须单行）：**
```
[{"name":"无尽资源","url":"https://api.wujinapi.me/api.php/provide/vod","isEnabled":true},{"name":"茅台资源","url":"https://caiji.maotaizy.cc/api.php/provide/vod","isEnabled":true},{"name":"猫眼资源","url":"https://api.maoyanapi.top/api.php/provide/vod","isEnabled":true}]
```

⚠️ **注意：**
- 必须是单行，不能有换行
- 不要有多余的空格
- 确保 JSON 格式正确

---

## 🔍 验证配置

部署完成后，打开浏览器控制台（F12），查看日志：

✅ **成功：**
```
✅ 成功加载视频源配置 (简单格式): 5 个源
```
或
```
✅ 成功加载视频源配置 (JSON格式): 5 个源
```

❌ **失败：**
```
⚠️ 未配置 VITE_INITIAL_VIDEO_SOURCES 环境变量
```
或
```
❌ 视频源配置格式错误，请检查环境变量
```

---

## 🎬 推荐的视频源配置

### 简单格式（复制使用）

```
无尽资源|https://api.wujinapi.me/api.php/provide/vod,茅台资源|https://caiji.maotaizy.cc/api.php/provide/vod,猫眼资源|https://api.maoyanapi.top/api.php/provide/vod,百度资源|https://api.apibdzy.com/api.php/provide/vod,红牛资源|https://www.hongniuzy2.com/api.php/provide/vod
```

### 只配置3个源（更简洁）

```
无尽资源|https://api.wujinapi.me/api.php/provide/vod,茅台资源|https://caiji.maotaizy.cc/api.php/provide/vod,猫眼资源|https://api.maoyanapi.top/api.php/provide/vod
```

---

## 🔧 常见问题

### Q1: 配置后没有视频源显示？

**解决方法：**
1. 检查环境变量名称是否正确：`VITE_INITIAL_VIDEO_SOURCES`
2. 检查格式是否正确（使用 `|` 和 `,`）
3. 确保选择了正确的环境（Production）
4. 重新部署项目

### Q2: 如何添加更多视频源？

在现有配置后面添加 `,名称|URL`：

```
源1|URL1,源2|URL2,源3|URL3,新源|新URL
```

### Q3: 如何修改视频源顺序？

调整配置中源的顺序即可，第一个源的结果会优先显示。

### Q4: 可以使用中文名称吗？

可以！名称支持中文、英文、数字等。

---

## 📚 其他环境变量

### 访问密码（可选）

**变量名称：**
```
VITE_ACCESS_PASSWORD
```

**变量值：**
```
your_password_here
```

留空表示公开访问。

---

## 💡 提示

- 简单格式更适合 Cloudflare Pages
- 本地开发可以使用 JSON 格式（在 .env 文件中）
- 修改环境变量后必须重新部署才能生效
- 建议配置 3-5 个视频源作为备份

---

**祝部署顺利！** 🎉
