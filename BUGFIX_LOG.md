# BUGFIX_LOG

> 记录每次缺陷修复的：问题编号、根本原因、修改文件、验证方式、回归结论、回滚方式。
> 项目目录不是 git 仓库；修改前的文件副本保存在 `~/.capy/work/kx/backup/`（本机路径，不进项目）。

## 0. 回滚与基线

- 回滚：用 `~/.capy/work/kx/backup/` 下对应的 `.orig` / `.before*` 文件覆盖回去。
- 第一批 6 项修复（见 §1）没有保留原始副本，回滚需按"修改文件"手工还原。
- 建议在项目根目录 `git init` 后提交一次基线，后续每次修复单独提交。**尚未执行**（需要你确认）。

## 1. 已完成（2026-11-25，第一批）

| 编号 | 问题 | 修改文件 | 验证 | 回归 |
|---|---|---|---|---|
| D-01 | 用户添加的视频源不持久化，刷新即丢 | `src/store/apiStore.ts` | 运行时注入源后整页刷新，源仍在 | 首页/详情/搜索正常，源列表 4 条不变 |
| P-04 | `import.meta.env.DEVELOPMENT` 永假，StrictMode 从未启用 | `src/main.tsx` | dev 产物 StrictMode 分支生效；生产产物无 StrictMode | 构建通过，页面无异常 |
| C-01 / E-03 | 代理对所有响应统一 `max-age=86400` | `src/utils/proxy.ts`、`src/middleware/proxy.dev.ts`、`functions/proxy.ts` | JSON 连取两次 transferSize 8349/8349（回源）；图片 28914/0（缓存） | 图片与接口均正常 |
| P-01 | 无 404 路由，未知路径白屏 | `src/pages/NotFound.tsx`（新增）、`src/router/MyRouter.tsx` | `/nope` 渲染 404 页与"回到首页" | 全部既有路由正常 |
| P-02 | 搜索关键词未编码，含 `/` 时路由失配 | `src/hooks/useSearch.ts` | 搜索 `a/b` 命中 `/search/a%2Fb` 并正常渲染空态 | 普通关键词搜索 13 条结果 |
| P-05 | 无错误边界，渲染异常白屏 | `src/components/common/ErrorBoundary.tsx`（新增）、`src/main.tsx`、`src/components/layouts/Layout.tsx` | 构建通过；**未做运行时触发** | 无影响 |

## 2. 待修复队列

| 顺序 | 编号 | 问题 | 状态 |
|---|---|---|---|
| 1 | D-02 / P-03 | 越界集数导致空白播放器、无提示 | ✅ 已修复 |
| 2 | D-03 | `episodes` 与 `episode_names` 长度不一致 | ✅ 已修复 |
| 3 | E-02 | `/proxy` 未限制方法与内容类型 | ✅ 已修复 |
| 4 | E-07 | `/proxy` 无响应体大小上限 | ✅ 已修复 |
| 5 | D-06 | 重试无整体 deadline（3×15s） | 待处理 |
| 6 | C-03 | 批量测速不可取消 | 待处理 |
| 7 | D-05 | 设置项缺少数值范围校验 | 待处理 |
| 8 | D-04 | 从 URL 导入配置无校验 | 待处理 |
| 9 | D-08 | 源 id 随顺序漂移 | 待处理 |
| 10 | C-02 | 仅悬停可见的删除按钮 | 待处理 |

## 3. 测试基础设施

- 新增 `tests/episodeParser.test.mjs`，使用 Node 内置测试器（零新依赖）。
- 运行：`npm test`（即 `node --test`）。
- **要求 Node 22.6+**（依赖原生 TypeScript 类型擦除）。项目 `engines` 仍写 `>=20.0.0`，在 Node 20 上跑测试会失败，构建不受影响。

## 4. 修复记录

### 2026-11-25 / D-02 + P-03 · 越界集数静默失败

- **原始问题**：`/video/:sourceCode/:vodId/:episodeIndex` 中 `episodeIndex` 超出实际集数时，播放器初始化被跳过，页面显示"第 10000 集 · 共 25 集"但播放区全黑，无任何提示。
- **根本原因**：`episodeIndex` 从 URL 读取后原样写入 `selectedEpisode`，没有范围校验；播放 effect 里 `if (!detail.episodes[selectedEpisode]) return` 静默退出，而"无法获取播放信息"兜底只在 `episodes.length === 0` 时触发。
- **修复方案**：在 `detail` 加载完成且非空之后、渲染播放器之前，增加越界分支：显示"这一集不存在"、说明请求集数与实际集数，并提供"从第 1 集播放"与"返回"两个出口。位置放在空数据分支之后，保证 TypeScript 能收窄 `detail` 非空。
- **修改文件**：`src/pages/Video.tsx`
- **测试**：
  - `/video/env_source_0/137597/9999`（该源仅 1 集）→ 显示"这一集不存在 链接请求的是第 10000 集，这个源当前只有 1 集"，含两个按钮。
  - `/video/env_source_0/121988/289`（288 集）→ 显示"第 290 集…只有 288 集"。
- **回归**：同一 288 集源，`/0` 与 `/287` 均正常起播放器，标题分别为"第 1 集 · 共 288 集"与"第 288 集 · 共 288 集"；选集数量 288 与详情页一致；首页、搜索、404 页无变化，控制台 0 错误。
- **是否引入新问题**：无。
- **回滚**：`cp ~/.capy/work/kx/backup/Video.tsx.orig src/pages/Video.tsx`（注意：该备份是本次修改前的状态）

### 2026-11-25 / D-03 · 选集名称与播放地址契约不一致

- **原始问题**：`episodes`（播放地址）经过 http 过滤，`episode_names`（选集名称）未过滤，两者可能不同长，选集按钮与地址错位。
- **根本原因**：同一份 `vod_play_url` 被解析两次、用两套规则过滤。
- **修复方案**：抽出 `src/services/episodeParser.ts` 的 `parsePlaySources`，一次解析出 `{ name, url }`，只保留地址可播放的条目，再分别 map 成两个数组，保证同长同序；`vod_content` 正则兜底分支同样补齐名称数组。
- **修改文件**：`src/services/episodeParser.ts`（新增）、`src/services/api.service.ts`
- **测试**：新增 `tests/episodeParser.test.mjs` 6 条用例，覆盖 m3u8 优先、回退最后一个源、脏条目同时剔除、名称缺失补位、空输入、源数量不一致不越界。`npm test` 6/6 通过。
- **回归**：真实 288 集源详情页显示 288 集，末集可播放且标题正确；越界提示正常（见上一条）。首页/搜索/播放其余路径无变化。
- **是否引入新问题**：无。
- **回滚**：`cp ~/.capy/work/kx/backup/api.service.ts.orig src/services/api.service.ts`

### 2026-11-25 / E-02 · `/proxy` 可当通用下载中继

- **原始问题**：代理不限制 HTTP 方法，也不限制内容类型；实测任意二进制（`application/octet-stream`）与 `POST` 都能透传。
- **根本原因**：只判断了"是不是 HTML"，其余类型一律放行。
- **修复方案**：只允许 `GET`/`HEAD`/`OPTIONS`，其余 405 并带 `Allow`；响应内容类型白名单（`image/*`、`video/*`、`audio/*`、`text/plain`、`application/json`、`*+json`、`mpegurl`），其余 415。`text/html` 分支转换出的 `text/plain` 仍按原逻辑放行。
- **修改文件**：`functions/proxy.ts`
- **验证**（`wrangler pages dev`，真实 Workers 运行时）：
  - `POST /proxy` → `405 Method Not Allowed`，`Allow: GET, HEAD, OPTIONS`
  - `__down?bytes=1024`（octet-stream）→ `415`
  - 真实源 JSON → `200 text/plain`，`Cache-Control: no-store`
  - 真实海报 → `200 image/jpeg`，`Cache-Control: public, max-age=604800, immutable`
- **回归**：搜索/详情依赖的 JSON 与图片均正常；应用层回归脚本 6 项全过，控制台 0 错误。
- **遗留差异**：开发期 Vite 中间件（`src/middleware/proxy.dev.ts`）没有同步方法/类型限制，仅生产生效。
- **回滚**：`cp ~/.capy/work/kx/backup/proxy.fn.ts.orig functions/proxy.ts`

### 2026-11-25 / E-07 · `/proxy` 无响应体大小上限

- **原始问题**：代理只有 15 秒超时，没有体积上限，大文件会长时间占用函数实例。
- **修复方案**：先看 `Content-Length`，超过 20MB 直接 `413`；无 `Content-Length` 时用 `limitBodySize` 包装响应流，累计超过 20MB 即停止转发；`text/plain` 分支同样按字节长度校验。
- **修改文件**：`functions/proxy.ts`
- **验证**：`__down?bytes=25000000`（约 25MB）→ `413 Payload Too Large`。
- **回归**：正常 JSON/图片不受影响（同上）。
- **回滚**：同 E-02。

### 2026-11-25 / P-06 · 搜索中先闪"没有找到相关内容"

- **原始问题**：每次进入搜索结果页，先显示"没有找到相关内容 / 0 条结果"，约半秒后才出现结果。
- **根本原因**：`SearchResult` 里被取消的搜索在 `.finally` 中无条件 `setLoading(false)`。开发环境开着 StrictMode 时 effect 会执行两次，第一次搜索被第二次 abort，它的 finally 把界面置为空态，而第二次搜索还在跑；生产环境在视频源列表变化（设置改动、源异步加载完成）触发重搜时同样会出现。
- **修复方案**：`.finally` 中只在 `abortCtrlRef.current === controller`（即当前这次搜索）时才结束 loading；另外加载中且无结果时，标题不再显示"0 条结果"，改为"正在搜索 N 个源…"。
- **修改文件**：`src/pages/SearchResult.tsx`
- **测试**：CDP 采样 `每 150ms` 记录页面状态。
  - 修复前：`166ms` 空白 → `860ms` empty=Y / 0 条结果 → `1480ms` 出现 1 条结果。
  - 修复后：`636ms` 搜索中（无空态）→ `1100ms` 1 条 → `1872ms` 3 条，全程无空态。
  - 无结果关键词 `zzzzqqq12345`：`866ms` 搜索中 → `3656ms` 正确显示空态（只在搜索结束后出现）。
- **回归**：正常关键词结果数量与分页不变；首页、详情、404 正常；控制台 0 错误。
- **是否引入新问题**：无。
- **回滚**：`cp ~/.capy/work/kx/backup/SearchResult.tsx.orig src/pages/SearchResult.tsx`

### 2026-11-25 / UI · 批量测速弹窗内容溢出到卡片外

- **原始问题**：批量测试弹窗里，结果列表的下半部分渲染到白色卡片之外，盖住下层表单，看不清也点不到。
- **根本原因**：`DialogContent` 的移动端定位类 `bottom-0 right-0` 在桌面端没有被取消，桌面端又设置了 `top: 50%`，于是元素高度被拉伸成视口的 50%（实测 648px 视口 → 324px 高），而内容实际需要 494px，且 `overflow: visible`，内容直接溢出到卡片外。
- **修复方案**：桌面端补 `sm:bottom-auto sm:right-auto`，恢复按内容自适应高度；同时给弹窗内容加 `max-h-[90dvh] overflow-y-auto`，短屏时在弹窗内部滚动而不是溢出。
- **修改文件**：`src/components/ui/dialog.tsx`
- **测试**：
  - 1280×800：弹窗高 518px、内容高 518px，内部滚动区 384px，子元素最低点比卡片底部高 25px（无溢出）。
  - 1024×560：弹窗被限制在 90dvh（367px）并在内部滚动，内容不再绘制到卡片外。
- **回归**：弹窗仍居中显示；其他使用同一容器的弹窗（导入源、确认框）不受影响。
- **回滚**：`cp ~/.capy/work/kx/backup/dialog.tsx.orig src/components/ui/dialog.tsx`

### 2026-11-25 / D-09 · 环境变量里的视频源被解析成"乱源"

- **原始问题**：在 Cloudflare Pages 的 `VITE_INITIAL_VIDEO_SOURCES` 里粘贴整段 `.env` 后，设置页出现名为 `# 本地开发用的视频源（可自行增删，多个源用英文逗号分隔）# 已剔除：……VITE_INITIAL_VIDEO_SOURCES=猫眼资源` 的视频源，`U酷资源` 的地址尾部还粘上了站点品牌配置。
- **根本原因**：`loadInitialVideoSources` 只做 `split(',')` + `split('|')`，既不认 `.env` 注释行、不认 `NAME=` 前缀，也不校验 URL。整段 `.env` 里没有英文逗号的注释行会被并进后一条，于是注释、赋值前缀被当成源名称，最后一条源的 URL 又被后续品牌配置污染。实测真实 `.env`：4 个源里 2 个名称/地址是脏的。
- **修复方案**：抽出纯函数模块 `src/services/sourceConfigParser.ts`。先按行归一化（丢弃 `#` 注释行、去掉 `NAME=` 前缀；存在 `VITE_INITIAL_VIDEO_SOURCES=` 时只取该行），再区分 JSON 与 `名称|URL` 两种格式；名称含 `#`、`=`、换行，地址非 `http(s)`，或地址重复的条目直接丢弃。`apiStore.initializeEnvSources` 在"配了环境变量但解析不出源"时也清掉残留的 `env_source_*`，避免旧脏源一直挂在页面上。
- **修改文件**：`src/services/sourceConfigParser.ts`（新增）、`src/config/api.config.ts`、`src/store/apiStore.ts`、`tests/sourceConfigParser.test.mjs`（新增）
- **验证**：
  - 用项目真实 `.env` 整段文本过新解析器 → `simple` 格式、4 个源，名称与地址均干净（`env_source_0..3`）。
  - 单行正确填法同样解析出 4 个源。
  - 新增 12 条单测，覆盖整段 `.env`、逐行格式、JSON（含前缀/多行）、引号、脏条目、重复 URL、空值；`npm test` 18/18。
- **回归**：`tsc --noEmit` 0 error；`eslint` 0 error（1 条既有 warning）；`vite build` 通过。
- **回滚**：`git revert <本次提交>`。

### 2026-11-25 / E-08 · 源站 WAF 拦截 `?wd=` 导致该源搜索全灭

- **原始问题**：无尽资源（`api.wujinapi.me`）在站点里搜任何关键词都返回 0 条，控制台里该源搜索失败。
- **根本原因**：源站的 Cloudflare WAF 把带 `wd=` 的查询参数当成攻击特征，GET 请求一律回 `403` + 人机验证页（`Just a moment...`）；同一批参数放进 POST 表单则是 `200`，正常返回 9 条。代理只发 GET，拿到 403 HTML 后被"HTML 不转发"规则挡成 502。它的详情接口（`ac=videolist&ids=`）一直是好的，所以只有"搜不到、点不进"。
- **修复方案**：代理收到 `403/503` 且响应是 HTML、内容像 Cloudflare 验证页时，把查询串原样搬到 POST 表单重试一次；重试仍被拦、或原 URL 没有查询参数，就保留原响应不额外发请求。生产函数与开发中间件同步改。
- **修改文件**：`functions/proxy.ts`、`src/utils/proxy.ts`、`tests/proxyChallengeRetry.test.mjs`（新增）
- **验证**：
  - 直接调用 `functions/proxy.ts` 的 `onRequest` 发真实请求：无尽搜索 `200` / 9 条（修复前 `502`）、详情 `200` / 1 条；apibfzy、猫眼、zuidapi 均 `200`，无回归。
  - 单测 5 条：验证页触发一次 POST 且参数搬对、普通 403 HTML 不重试、重试仍被拦时回落原响应、无查询参数不重试、正常 JSON 不产生额外请求。
- **回归**：`npm test` 23/23；`tsc --noEmit` 0 error；`eslint` 0 error；`vite build` 通过。
- **回滚**：`git revert <本次提交>`。

## 5. 本轮总结

- 共修复 9 项（D-01、P-01、P-02、P-04、P-05、C-01/E-03、D-02/P-03、D-03、E-02、E-07、P-06、弹窗溢出、D-09），新增 4 个模块/测试文件。
- `tsc --noEmit` 通过；`eslint` 0 error（1 条既有 warning，位于 shadcn 生成的 `button.tsx`）；`vite build` 通过；`npm test` 23/23。
- 未修复项见 §2 队列。
