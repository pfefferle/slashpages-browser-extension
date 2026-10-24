import { test } from 'node:test'
import assert from 'node:assert/strict'
import { groupProbes } from '../src/probe.js'
import { SLASHPAGES } from '../src/slashpages.js'

const origin = 'https://example.com'

test('lists the paths that answered on the same path', () => {
  const pages = groupProbes([
    { name: 'about', ok: true, url: 'https://example.com/about/' },
    { name: 'now', ok: true, url: 'https://example.com/Now' },
    { name: 'uses', ok: false, url: 'https://example.com/uses' }
  ], origin)

  assert.deepEqual(pages, [
    { text: '/about', url: 'https://example.com/about/', names: ['/about'] },
    { text: '/now', url: 'https://example.com/Now', names: ['/now'] }
  ])
})

test('skips redirects to other paths, other sites and broken answers', () => {
  const pages = groupProbes([
    { name: 'hello', ok: true, url: 'https://example.com/micro/hello/' },
    { name: 'log', ok: true, url: 'https://example.com/changelog/' },
    { name: 'uses', ok: true, url: 'https://example.com/' },
    { name: 'tip', ok: true, url: 'https://ko-fi.com/tip' },
    { name: 'ai', ok: false, url: '' },
    { name: 'now', ok: true, url: '' }
  ], origin)

  assert.deepEqual(pages, [])
})

test('the list has unique, lowercase names', () => {
  const names = SLASHPAGES.flat()

  assert.equal(new Set(names).size, names.length)
  assert.ok(names.every((name) => /^[a-z0-9-]+$/.test(name)))
})
