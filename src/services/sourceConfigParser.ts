import type { VideoApi } from '@/types'

export type SourceConfigFormat = 'json' | 'simple' | 'empty'

export interface SourceParseOptions {
  timeout?: number
  retry?: number
}

export interface SourceParseResult {
  format: SourceConfigFormat
  sources: VideoApi[]
  error?: string
}

const DEFAULT_TIMEOUT = 3000
const DEFAULT_RETRY = 3
// 环境变量的 .env 赋值前缀，例如 VITE_INITIAL_VIDEO_SOURCES=
const ENV_ASSIGNMENT = /^[A-Za-z_][A-Za-z0-9_]*\s*=\s*/
// 一段 .env 里真正承载源列表的那一行
const SOURCE_ASSIGNMENT = /^VITE_INITIAL_VIDEO_SOURCES\s*=\s*/
const HTTP_URL = /^https?:\/\/[^\s]+$/i
const INVALID_NAME = /[#=\r\n]/

const stripQuotes = (raw: string): string =>
  raw
    .trim()
    .replace(/^['"`]([\s\S]*)['"`]$/, '$1')
    .trim()

const buildSource = (
  name: string,
  url: string,
  index: number,
  options: SourceParseOptions,
): VideoApi | null => {
  const sourceName = name.trim()
  // 行尾粘上的 # 注释要切掉，否则整条地址都算非法
  const sourceUrl = url.split('#')[0].trim()

  if (!sourceName || INVALID_NAME.test(sourceName)) return null
  if (!HTTP_URL.test(sourceUrl)) return null

  return {
    id: `env_source_${index}`,
    name: sourceName,
    url: sourceUrl,
    detailUrl: sourceUrl,
    isEnabled: true,
    updatedAt: new Date(),
    timeout: options.timeout ?? DEFAULT_TIMEOUT,
    retry: options.retry ?? DEFAULT_RETRY,
  }
}

// 把整段 .env 文本还原成“一行一个赋值”，去掉注释行与 NAME= 前缀。
// 若其中存在 VITE_INITIAL_VIDEO_SOURCES 赋值，只取该行，避免把站点品牌等配置当成源。
const normalizeConfigLines = (raw: string): string => {
  const lines = raw
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('#'))

  const sourceLines = lines.filter(line => SOURCE_ASSIGNMENT.test(line))
  const selected = sourceLines.length > 0 ? sourceLines : lines

  return selected
    .map(line => line.replace(ENV_ASSIGNMENT, '').trim())
    .filter(line => line.length > 0)
    .join(',')
    .replace(/,{2,}/g, ',')
}

const parseSimpleConfig = (raw: string, options: SourceParseOptions): VideoApi[] => {
  const normalized = normalizeConfigLines(raw)
  if (!normalized) return []

  const sources: VideoApi[] = []
  const seenUrls = new Set<string>()

  normalized.split(',').forEach(entry => {
    const separator = entry.indexOf('|')
    if (separator === -1) return

    const source = buildSource(
      entry.slice(0, separator),
      entry.slice(separator + 1),
      sources.length,
      options,
    )
    if (!source || seenUrls.has(source.url)) return

    seenUrls.add(source.url)
    sources.push(source)
  })

  return sources
}

export const parseSourceList = (
  list: unknown[],
  options: SourceParseOptions = {},
): VideoApi[] => {
  const sources: VideoApi[] = []
  const seenUrls = new Set<string>()

  list.forEach(entry => {
    if (!entry || typeof entry !== 'object') return

    const record = entry as Record<string, unknown>
    const name = typeof record.name === 'string' ? record.name : ''
    const url = typeof record.url === 'string' ? record.url : ''
    const source = buildSource(name, url, sources.length, options)
    if (!source || seenUrls.has(source.url)) return

    seenUrls.add(source.url)
    if (typeof record.id === 'string' && record.id.trim()) source.id = record.id.trim()
    if (typeof record.detailUrl === 'string' && HTTP_URL.test(record.detailUrl.trim())) {
      source.detailUrl = record.detailUrl.trim()
    }
    if (typeof record.isEnabled === 'boolean') source.isEnabled = record.isEnabled
    if (typeof record.timeout === 'number' && record.timeout > 0) source.timeout = record.timeout
    if (typeof record.retry === 'number' && record.retry > 0) source.retry = record.retry

    sources.push(source)
  })

  return sources
}

export const parseSourceConfig = (
  raw: string | undefined | null,
  options: SourceParseOptions = {},
): SourceParseResult => {
  const trimmed = stripQuotes(String(raw ?? ''))
  if (!trimmed) return { format: 'empty', sources: [] }

  // 多行 JSON 先原样交给 JSON.parse，归一化会把换行变成逗号反而破坏它
  const jsonCandidate = trimmed.startsWith('[') || trimmed.startsWith('{')
    ? trimmed
    : normalizeConfigLines(trimmed)

  if (jsonCandidate.startsWith('[') || jsonCandidate.startsWith('{')) {
    try {
      const parsed: unknown = JSON.parse(jsonCandidate)
      const list = Array.isArray(parsed) ? parsed : [parsed]
      return { format: 'json', sources: parseSourceList(list, options) }
    } catch (error) {
      return {
        format: 'json',
        sources: [],
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  const sources = parseSimpleConfig(trimmed, options)
  return { format: sources.length > 0 ? 'simple' : 'empty', sources }
}
