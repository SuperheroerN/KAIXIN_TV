import { test } from 'node:test'
import assert from 'node:assert/strict'
import { onRequest } from '../functions/proxy.ts'

const CHALLENGE_HTML =
  '<!DOCTYPE html><html lang="en-US"><head><title>Just a moment...</title></head><body>Checking your browser</body></html>'

const proxy = target =>
  onRequest({
    request: new Request(`http://local/proxy?url=${encodeURIComponent(target)}`),
    env: {},
    params: {},
  })

const withFetch = async (impl, run) => {
  const original = globalThis.fetch
  globalThis.fetch = impl
  try {
    return await run()
  } finally {
    globalThis.fetch = original
  }
}

test('GET 被 Cloudflare 人机验证拦截时，改用 POST 表单重试并返回数据', async () => {
  const target = 'https://api.example.com/api.php/provide/vod/?ac=videolist&wd=%E5%BA%86%E4%BD%99%E5%B9%B4'
  const calls = []

  const result = await withFetch(
    async (url, init = {}) => {
      calls.push({ url: String(url), method: init.method ?? 'GET', body: init.body ?? null })
      if ((init.method ?? 'GET') === 'GET') {
        return new Response(CHALLENGE_HTML, { status: 403, headers: { 'Content-Type': 'text/html' } })
      }
      return new Response(JSON.stringify({ code: 1, list: [{ vod_name: '庆余年' }] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    },
    () => proxy(target),
  )

  assert.equal(result.status, 200)
  assert.equal(calls.length, 2)
  assert.equal(calls[0].method, 'GET')
  assert.equal(calls[1].method, 'POST')
  assert.equal(calls[1].url, 'https://api.example.com/api.php/provide/vod/')
  assert.equal(calls[1].body, 'ac=videolist&wd=%E5%BA%86%E4%BD%99%E5%B9%B4')
  assert.deepEqual(await result.json(), { code: 1, list: [{ vod_name: '庆余年' }] })
})

test('普通的 403 HTML（不是验证页）不重试，仍然按 HTML 拒绝', async () => {
  const calls = []
  const result = await withFetch(
    async (url, init = {}) => {
      calls.push({ method: init.method ?? 'GET' })
      return new Response('<html><body>Forbidden</body></html>', {
        status: 403,
        headers: { 'Content-Type': 'text/html' },
      })
    },
    () => proxy('https://api.example.com/api.php/provide/vod/?wd=test'),
  )

  assert.equal(calls.length, 1)
  assert.equal(result.status, 502)
})

test('POST 重试仍然被拦截时，回落到原始响应', async () => {
  const calls = []
  const result = await withFetch(
    async (url, init = {}) => {
      calls.push({ method: init.method ?? 'GET' })
      return new Response(CHALLENGE_HTML, { status: 403, headers: { 'Content-Type': 'text/html' } })
    },
    () => proxy('https://api.example.com/api.php/provide/vod/?wd=test'),
  )

  assert.equal(calls.length, 2)
  assert.equal(result.status, 502)
})

test('没有查询参数时不发 POST 重试', async () => {
  const calls = []
  const result = await withFetch(
    async (url, init = {}) => {
      calls.push({ method: init.method ?? 'GET' })
      return new Response(CHALLENGE_HTML, { status: 403, headers: { 'Content-Type': 'text/html' } })
    },
    () => proxy('https://api.example.com/api.php/provide/vod/'),
  )

  assert.equal(calls.length, 1)
  assert.equal(result.status, 502)
})

test('正常 JSON 请求不产生额外请求', async () => {
  const calls = []
  const result = await withFetch(
    async (url, init = {}) => {
      calls.push({ method: init.method ?? 'GET' })
      return new Response(JSON.stringify({ code: 1, list: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    },
    () => proxy('https://api.example.com/api.php/provide/vod/?ac=videolist&wd=test'),
  )

  assert.equal(calls.length, 1)
  assert.equal(result.status, 200)
})
