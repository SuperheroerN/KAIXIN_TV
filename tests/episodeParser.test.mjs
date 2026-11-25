import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parsePlaySources } from '../src/services/episodeParser.ts'

const url = n => `https://cdn.example.com/${n}.m3u8`

test('优先选择 m3u8 源，并解析出名称与地址', () => {
  const play = `第1集$${url(1)}#第2集$${url(2)}$$$第1集$${url(9)}`
  const from = `m3u8$$$mp4`
  const parsed = parsePlaySources(play, from)
  assert.deepEqual(parsed.episodes, [url(1), url(2)])
  assert.deepEqual(parsed.episodeNames, ['第1集', '第2集'])
})

test('没有 m3u8 源时回退到最后一个源', () => {
  const play = `a$${url(1)}$$$b$${url(2)}`
  const parsed = parsePlaySources(play, 'mp4$$$mp4')
  assert.deepEqual(parsed.episodes, [url(2)])
  assert.deepEqual(parsed.episodeNames, ['b'])
})

test('两个数组长度与顺序始终一致（脏条目被同时剔除）', () => {
  const play = `第1集$${url(1)}#第2集#第3集$ftp://x/3.m3u8#第4集$${url(4)}`
  const parsed = parsePlaySources(play, 'm3u8')
  assert.equal(parsed.episodes.length, parsed.episodeNames.length)
  assert.deepEqual(parsed.episodes, [url(1), url(4)])
  assert.deepEqual(parsed.episodeNames, ['第1集', '第4集'])
})

test('名称缺失时按位置补“第N集”', () => {
  const play = `$${url(1)}#$${url(2)}`
  const parsed = parsePlaySources(play, 'm3u8')
  assert.deepEqual(parsed.episodeNames, ['第1集', '第2集'])
})

test('空输入返回空数组', () => {
  const parsed = parsePlaySources('', '')
  assert.deepEqual(parsed.episodes, [])
  assert.deepEqual(parsed.episodeNames, [])
})

test('源数量与 from 数量不一致时不越界', () => {
  const play = `第1集$${url(1)}`
  const parsed = parsePlaySources(play, 'm3u8$$$mp4$$$mp4')
  assert.deepEqual(parsed.episodes, [url(1)])
})
