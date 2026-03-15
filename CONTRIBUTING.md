# 贡献指南

感谢你考虑为 KAIXIN TV 做出贡献！

## 🎯 贡献方式

你可以通过以下方式为项目做出贡献：

- 🐛 报告 Bug
- 💡 提出新功能建议
- 📝 改进文档
- 🔧 提交代码修复或新功能
- 🌍 翻译文档
- ⭐ 给项目点 Star

## 📋 开发环境设置

### 1. Fork 项目

点击项目页面右上角的 "Fork" 按钮

### 2. 克隆到本地

```bash
git clone https://github.com/your-username/kaixin-tv.git
cd kaixin-tv
```

### 3. 安装依赖

```bash
pnpm install
```

### 4. 创建分支

```bash
git checkout -b feature/your-feature-name
```

### 5. 开发

```bash
pnpm dev
```

## 📝 代码规范

### TypeScript

- 使用 TypeScript 编写所有代码
- 为函数和组件添加类型注解
- 避免使用 `any` 类型

```typescript
// ✅ 好的示例
interface Props {
  title: string
  count: number
}

function Component({ title, count }: Props) {
  // ...
}

// ❌ 避免
function Component(props: any) {
  // ...
}
```

### React 组件

- 使用函数式组件
- 使用 Hooks 管理状态
- 组件文件使用 PascalCase 命名

```typescript
// ✅ 好的示例
export default function VideoCard({ video }: VideoCardProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  
  return (
    <div>...</div>
  )
}
```

### 样式

- 优先使用 Tailwind CSS
- 复杂样式使用 CSS Modules
- 避免内联样式

```typescript
// ✅ 好的示例
<div className="flex items-center gap-4 p-4 rounded-lg">
  ...
</div>

// ❌ 避免
<div style={{ display: 'flex', padding: '16px' }}>
  ...
</div>
```

### 命名规范

- 组件：PascalCase (`VideoCard.tsx`)
- 函数：camelCase (`fetchVideos`)
- 常量：UPPER_SNAKE_CASE (`API_BASE_URL`)
- 文件夹：kebab-case (`video-player`)

## 🧪 测试

在提交 PR 前，请确保：

- [ ] 代码通过 ESLint 检查
- [ ] 所有功能正常工作
- [ ] 没有控制台错误
- [ ] 在不同浏览器测试（Chrome, Firefox, Safari）
- [ ] 移动端适配正常

```bash
# 运行 ESLint
pnpm lint

# 构建测试
pnpm build
```

## 📤 提交代码

### Commit 规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type 类型：**

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具相关

**示例：**

```bash
feat(search): 添加多源搜索功能

- 支持同时搜索多个视频源
- 自动去重
- 按优先级排序结果

Closes #123
```

### 提交 Pull Request

1. 确保代码符合规范
2. 更新相关文档
3. 填写 PR 模板
4. 等待 Review

## 🐛 报告 Bug

使用 [Issue 模板](https://github.com/your-username/kaixin-tv/issues/new?template=bug_report.md) 报告 Bug

**请包含：**

- 问题描述
- 复现步骤
- 预期行为
- 实际行为
- 截图（如果适用）
- 环境信息（浏览器、操作系统等）

## 💡 功能建议

使用 [Issue 模板](https://github.com/your-username/kaixin-tv/issues/new?template=feature_request.md) 提出建议

**请包含：**

- 功能描述
- 使用场景
- 预期效果
- 可选的实现方案

## 📚 文档贡献

文档同样重要！你可以：

- 修正错别字
- 改进说明
- 添加示例
- 翻译文档

## 🌍 国际化

如果你想帮助翻译项目：

1. 在 `src/locales/` 创建新的语言文件
2. 翻译所有文本
3. 更新语言选择器
4. 提交 PR

## ❓ 问题讨论

如果你有任何问题：

- 查看 [FAQ](https://github.com/your-username/kaixin-tv/wiki/FAQ)
- 搜索 [Issues](https://github.com/your-username/kaixin-tv/issues)
- 在 [Discussions](https://github.com/your-username/kaixin-tv/discussions) 提问

## 📜 行为准则

参与本项目即表示你同意遵守我们的 [行为准则](CODE_OF_CONDUCT.md)

## 🎉 贡献者

感谢所有贡献者！

<a href="https://github.com/your-username/kaixin-tv/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=your-username/kaixin-tv" />
</a>

---

再次感谢你的贡献！ 🙏
