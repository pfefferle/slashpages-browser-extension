import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DOMParser as XmlDomParser } from '@xmldom/xmldom'
import { countSlashpages, parseSlashpages, webUrl } from '../src/opml.js'

// Like the DOMParser of the browser, without logging parse errors.
class DOMParser extends XmlDomParser {
  constructor () {
    super({ onError: () => {} })
  }
}

const base = 'https://example.com/.well-known/slashpages'

const opml = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>Slash pages of example.com</title>
  </head>
  <body>
    <outline type="link" text="About me" category="/about" url="https://example.com/about/" />
    <outline type="link" text="Changelog" category="/changelog, /Log" url="https://example.com/log/" />
    <outline type="link" text="Relative" category="/now" url="/jetzt/" />
    <outline type="link" text="Evil" category="/uses" url="javascript:alert(1)" />
    <outline type="link" text="No URL" category="/ai" />
    <outline type="include" text="More" url="https://example.com/more.opml" />
    <outline text="Group">
      <outline type="link" text="" category="/colophon" url="https://example.com/colophon/" />
    </outline>
  </body>
</opml>`

test('reads the title and the link outlines', () => {
  const result = parseSlashpages(opml, base, DOMParser)

  assert.equal(result.title, 'Slash pages of example.com')
  assert.deepEqual(result.pages, [
    { text: 'About me', url: 'https://example.com/about/', names: ['/about'] },
    { text: 'Changelog', url: 'https://example.com/log/', names: ['/changelog', '/log'] },
    { text: 'Relative', url: 'https://example.com/jetzt/', names: ['/now'] },
    { text: '/colophon', url: 'https://example.com/colophon/', names: ['/colophon'] }
  ])
})

test('works without category', () => {
  const xml = '<opml version="2.0"><body><outline type="link" text="Now" url="https://example.com/now/"/></body></opml>'

  assert.deepEqual(parseSlashpages(xml, base, DOMParser).pages, [
    { text: 'Now', url: 'https://example.com/now/', names: [] }
  ])
})

test('returns null for documents that are no OPML', () => {
  assert.equal(parseSlashpages('<html><body>Not found</body></html>', base, DOMParser), null)
  assert.equal(parseSlashpages('not xml at all <', base, DOMParser), null)
  assert.equal(parseSlashpages('', base, DOMParser), null)
})

test('only allows web URLs', () => {
  assert.equal(webUrl('https://example.com/', base), 'https://example.com/')
  assert.equal(webUrl('/now/', base), 'https://example.com/now/')
  assert.equal(webUrl('javascript:alert(1)', base), null)
  assert.equal(webUrl('mailto:me@example.com', base), null)
  assert.equal(webUrl(null, base), null)
})

test('counts the link outlines for the badge', () => {
  assert.equal(countSlashpages(opml), 6)
  assert.equal(countSlashpages('<opml version="2.0"><body></body></opml>'), 0)
  assert.equal(countSlashpages('<html><body>Not found</body></html>'), null)
})
