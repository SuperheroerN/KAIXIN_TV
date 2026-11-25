export interface ParsedEpisodes {
  episodes: string[]
  episodeNames: string[]
}

const PLAY_SOURCE_SEPARATOR = '$$$'
const EPISODE_SEPARATOR = '#'

const isPlayableUrl = (url: string): boolean =>
  url.startsWith('http://') || url.startsWith('https://')

/**
 * 从 vod_play_url / vod_play_from 解析选集。
 * 名称与地址来自同一条目、同一套过滤，保证两个数组同长同序。
 */
export function parsePlaySources(vodPlayUrl: string, vodPlayFrom: string): ParsedEpisodes {
  const playSources = vodPlayUrl.split(PLAY_SOURCE_SEPARATOR)
  const playFroms = vodPlayFrom.split(PLAY_SOURCE_SEPARATOR)

  if (playSources.length === 0) return { episodes: [], episodeNames: [] }

  let sourceIndex = playFroms.findIndex(from => from.toLowerCase().includes('m3u8'))
  if (sourceIndex === -1) sourceIndex = playSources.length - 1
  if (sourceIndex >= playSources.length) sourceIndex = playSources.length - 1

  const entries = playSources[sourceIndex]
    .split(EPISODE_SEPARATOR)
    .map((entry, index) => {
      const [name, url] = entry.split('$')
      return { name: name || `第${index + 1}集`, url: url ?? '' }
    })
    .filter(entry => isPlayableUrl(entry.url))

  return {
    episodes: entries.map(entry => entry.url),
    episodeNames: entries.map(entry => entry.name),
  }
}
