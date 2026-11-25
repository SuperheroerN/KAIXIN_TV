import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseSourceConfig } from '../src/services/sourceConfigParser.ts'

const SITE_A = 'https://api.maoyanapi.top/api.php/provide/vod'
const SITE_B = 'https://api.apibdzy.com/api.php/provide/vod'
const SITE_C = 'https://www.hongniuzy2.com/api.php/provide/vod'
const SITE_D = 'https://api.ukuapi88.com/api.php/provide/vod'

const SIMPLE = `猫眼资源|${SITE_A},百度资源|${SITE_B},红牛资源|${SITE_C},U酷资源|${SITE_D}`

// 用户实际粘贴进 Cloudflare 变量的内容：整段 .env
const ENV_BLOCK = `# 本地开发用的视频源（可自行增删，多个源用英文逗号分隔）
# 已剔除：新浪资源（Node 侧连接超时）、卧龙资源（域名解析失败）
VITE_INITIAL_VIDEO_SOURCES=${SIMPLE}

# 站点品牌（可随意改，改完重启生效）
VITE_SITE_NAME=开心影视
VITE_SITE_SUBTITLE=KAIXIN TV
VITE_SITE_DESCRIPTION=聚合多源影视资源，热门、最新、经典一站直达`

test('单行简单格式解析出 4 个源，id 连续', () => {
  const { format, sources } = parseSourceConfig(SIMPLE)
  assert.equal(format, 'simple')
  assert.deepEqual(
    sources.map(s => s.name),
    ['猫眼资源', '百度资源', '红牛资源', 'U酷资源'],
  )
  assert.deepEqual(
    sources.map(s => s.url),
    [SITE_A, SITE_B, SITE_C, SITE_D],
  )
  assert.deepEqual(
    sources.map(s => s.id),
    ['env_source_0', 'env_source_1', 'env_source_2', 'env_source_3'],
  )
})

test('整段 .env 粘贴进来时，只取赋值行的值，注释和站点品牌不会混进源', () => {
  const { sources } = parseSourceConfig(ENV_BLOCK)
  assert.deepEqual(
    sources.map(s => s.name),
    ['猫眼资源', '百度资源', '红牛资源', 'U酷资源'],
  )
  sources.forEach(source => {
    assert.doesNotMatch(source.name, /#|=|\n/, `源名称被污染: ${JSON.stringify(source.name)}`)
    assert.match(source.url, /^https?:\/\/\S+$/, `源地址被污染: ${JSON.stringify(source.url)}`)
  })
})

test('每行一个源（没有英文逗号）也能解析', () => {
  const raw = [`猫眼资源|${SITE_A}`, `百度资源|${SITE_B}`, `U酷资源|${SITE_D}`].join('\n')
  const { sources } = parseSourceConfig(raw)
  assert.deepEqual(
    sources.map(s => s.name),
    ['猫眼资源', '百度资源', 'U酷资源'],
  )
})

test('JSON 数组（多行）解析', () => {
  const raw = `[
    {"name":"猫眼资源","url":"${SITE_A}"},
    {"name":"百度资源","url":"${SITE_B}","isEnabled":false}
  ]`
  const { format, sources } = parseSourceConfig(raw)
  assert.equal(format, 'json')
  assert.deepEqual(
    sources.map(s => s.name),
    ['猫眼资源', '百度资源'],
  )
  assert.equal(sources[1].isEnabled, false)
})

test('JSON 带 VITE_INITIAL_VIDEO_SOURCES= 前缀也能解析', () => {
  const raw = `VITE_INITIAL_VIDEO_SOURCES=[{"name":"猫眼资源","url":"${SITE_A}"}]`
  const { format, sources } = parseSourceConfig(raw)
  assert.equal(format, 'json')
  assert.deepEqual(
    sources.map(s => s.name),
    ['猫眼资源'],
  )
})

test('值被引号包裹时自动去掉引号', () => {
  const { sources } = parseSourceConfig(`"${SIMPLE}"`)
  assert.equal(sources.length, 4)
  assert.equal(sources[0].name, '猫眼资源')
})

test('缺少 URL、非 http(s) URL 的条目被跳过', () => {
  const raw = `好源|${SITE_A},只有名字,坏源|ftp://x/y,坏源2|not-a-url,另一个好源|${SITE_B}`
  const { sources } = parseSourceConfig(raw)
  assert.deepEqual(
    sources.map(s => s.name),
    ['好源', '另一个好源'],
  )
  assert.deepEqual(
    sources.map(s => s.id),
    ['env_source_0', 'env_source_1'],
  )
})

test('名称里带 # 或 = 的脏条目被拒绝', () => {
  const raw = `注释源#|${SITE_A},VITE_X=值|${SITE_B},正常|${SITE_C}`
  const { sources } = parseSourceConfig(raw)
  assert.deepEqual(
    sources.map(s => s.name),
    ['正常'],
  )
})

test('同一 URL 只保留一个源', () => {
  const raw = `猫眼资源|${SITE_A},猫眼副本|${SITE_A}`
  const { sources } = parseSourceConfig(raw)
  assert.equal(sources.length, 1)
  assert.equal(sources[0].name, '猫眼资源')
})

test('行尾粘着的 # 注释不会污染最后一条源', () => {
  const raw = `猫眼资源|${SITE_A},U酷资源|${SITE_D}# 已剔除：新浪资源（Node 侧连接超时）`
  const { sources } = parseSourceConfig(raw)
  assert.deepEqual(
    sources.map(s => s.name),
    ['猫眼资源', 'U酷资源'],
  )
  assert.equal(sources[1].url, SITE_D)
})

test('只有注释或空值时返回空列表', () => {
  assert.deepEqual(parseSourceConfig('').sources, [])
  assert.deepEqual(parseSourceConfig('   ').sources, [])
  const onlyComments = parseSourceConfig('# 说明一行\n# 说明两行')
  assert.equal(onlyComments.sources.length, 0)
  assert.equal(onlyComments.format, 'empty')
})

test('JSON 语法错误时返回 error 而不是抛异常', () => {
  const result = parseSourceConfig('[{"name":"坏"')
  assert.equal(result.sources.length, 0)
  assert.ok(result.error)
})

test('解析出的源带有默认超时与重试配置', () => {
  const { sources } = parseSourceConfig(SIMPLE, { timeout: 8000, retry: 2 })
  assert.equal(sources[0].timeout, 8000)
  assert.equal(sources[0].retry, 2)
  assert.equal(sources[0].isEnabled, true)
  assert.equal(sources[0].detailUrl, SITE_A)
})
