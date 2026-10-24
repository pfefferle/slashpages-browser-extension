/**
 * Reads the slash pages from a /.well-known/slashpages OPML document.
 *
 * Only outlines of type "link" with a web URL are slash pages. Their
 * category is a comma-separated list of names, e.g. "/changelog,/log".
 * Includes are not followed.
 *
 * @see https://github.com/pfefferle/well-known-slashpages
 *
 * @param {string}   xml       The OPML document.
 * @param {string}   base      The URL of the document, for relative URLs.
 * @param {Function} DOMParser The DOMParser, passed in for the tests.
 * @returns {{title: string, pages: Array<{text: string, url: string, names: string[]}>}|null} The slash pages, or null if it is no OPML.
 */
export function parseSlashpages (xml, base, DOMParser = globalThis.DOMParser) {
  let doc
  try {
    doc = new DOMParser().parseFromString(xml, 'text/xml')
  } catch {
    return null
  }

  const root = doc && doc.documentElement
  if (!root || root.nodeName !== 'opml' || doc.getElementsByTagName('parsererror').length) {
    return null
  }

  const head = root.getElementsByTagName('title')[0]
  const pages = []

  for (const outline of Array.from(root.getElementsByTagName('outline'))) {
    if (outline.getAttribute('type') !== 'link') {
      continue
    }

    const url = webUrl(outline.getAttribute('url'), base)
    if (!url) {
      continue
    }

    const names = (outline.getAttribute('category') || '')
      .split(',')
      .map((name) => name.trim().toLowerCase())
      .filter((name) => name.startsWith('/'))

    pages.push({
      text: (outline.getAttribute('text') || '').trim() || names[0] || url,
      url,
      names
    })
  }

  return { title: head ? head.textContent.trim() : '', pages }
}

/**
 * Returns the absolute URL if it is a web address, e.g. not "javascript:".
 *
 * @param {string|null} url  The URL.
 * @param {string}      base The base URL.
 * @returns {string|null} The absolute URL, or null.
 */
export function webUrl (url, base) {
  if (!url) {
    return null
  }

  try {
    const parsed = new URL(url, base)
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : null
  } catch {
    return null
  }
}
