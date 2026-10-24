import { test } from 'node:test'
import assert from 'node:assert/strict'
import { groupProbes } from '../src/probe.js'
import { SLASHPAGES } from '../src/slashpages.js'

const origin = 'https://example.com'

test('lists the paths that answered, grouped by URL', () => {
  const pages = groupProbes([
    { name: 'about', ok: true, url: 'https://example.com/about/' },
    { name: 'changelog', ok: true, url: 'https://example.com/changelog/' },
    { name: 'log', ok: true, url: 'https://example.com/changelog/' },
    { name: 'now', ok: false, url: 'https://example.com/now' }
  ], origin)

  assert.deepEqual(pages, [
    { text: '/about', url: 'https://example.com/about/', names: ['/about'] },
    { text: '/changelog', url: 'https://example.com/changelog/', names: ['/changelog', '/log'] }
  ])
})

test('skips soft 404s, other sites and broken answers', () => {
  const pages = groupProbes([
    { name: 'uses', ok: true, url: 'https://example.com/' },
    { name: 'tip', ok: true, url: 'https://ko-fi.com/example' },
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
