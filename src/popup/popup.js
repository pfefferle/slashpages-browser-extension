import { parseSlashpages } from '../opml.js'
import { groupProbes } from '../probe.js'
import { SLASHPAGES } from '../slashpages.js'

// Firefox and Safari have `browser`, Chrome only `chrome`.
const api = globalThis.browser || globalThis.chrome

const PATH = '/.well-known/slashpages'

/**
 * Fetches the OPML in the page, where it is a same-origin request.
 *
 * Runs in the tab, so it must not use anything from outside the function.
 *
 * @param {string} url The URL of the OPML.
 * @returns {Promise<string|null>} The OPML, or null.
 */
async function fetchInPage (url) {
  try {
    const response = await fetch(url, { credentials: 'omit', cache: 'no-cache' })
    return response.ok ? await response.text() : null
  } catch {
    return null
  }
}

/**
 * Fetches the OPML of a site, first in the page, then from the popup.
 *
 * The popup request works if the site allows it with CORS, or if the
 * browser grants the active tab's origin with activeTab.
 *
 * @param {number} tabId  The tab.
 * @param {string} origin The origin of the site.
 * @returns {Promise<string|null>} The OPML, or null.
 */
async function fetchOpml (tabId, origin) {
  try {
    const [result] = await api.scripting.executeScript({
      target: { tabId },
      func: fetchInPage,
      args: [origin + PATH]
    })

    if (result && result.result) {
      return result.result
    }
  } catch {
    // No access to the page, try it from the popup.
  }

  try {
    const response = await fetch(origin + PATH, { credentials: 'omit', cache: 'no-cache' })
    return response.ok ? await response.text() : null
  } catch {
    return null
  }
}

/**
 * Requests slash page paths in the page, all at the same time.
 *
 * Runs in the tab, so it must not use anything from outside the function.
 *
 * @param {string}   origin The origin of the site.
 * @param {string[]} names  The slash page names, without the slash.
 * @returns {Promise<Array<{name: string, ok: boolean, url: string}>>} The answers.
 */
async function probeInPage (origin, names) {
  const request = async (name) => {
    const url = origin + '/' + name
    const options = { credentials: 'omit', cache: 'no-cache', redirect: 'follow', signal: AbortSignal.timeout(5000) }

    try {
      let response = await fetch(url, { ...options, method: 'HEAD' })

      // Some servers do not allow HEAD.
      if (response.status === 405 || response.status === 501) {
        response = await fetch(url, options)
      }

      return { name, ok: response.ok, url: response.url }
    } catch {
      return { name, ok: false, url: '' }
    }
  }

  return Promise.all(names.map(request))
}

/**
 * Looks for the known slash pages of a site by requesting their paths.
 *
 * The paths are requested in chunks, and every chunk shows what was found
 * so far, so the list grows while the slow requests are still running.
 *
 * @param {number}   tabId   The tab.
 * @param {string}   origin  The origin of the site.
 * @param {Function} onPages Called with the pages found so far.
 * @returns {Promise<Array<{text: string, url: string, names: string[]}>|null>} The pages, or null if probing does not work on this site.
 */
async function probe (tabId, origin, onPages) {
  const run = async (names) => {
    const [result] = await api.scripting.executeScript({
      target: { tabId },
      func: probeInPage,
      args: [origin, names]
    })

    return result && result.result ? result.result : []
  }

  try {
    // A site that answers a random path would make every path look like a slash page.
    if (groupProbes(await run([Math.random().toString(36).slice(2) + '-no-slash-page']), origin).length) {
      return null
    }

    const names = SLASHPAGES.flat()
    const results = []

    for (let i = 0; i < names.length; i += 12) {
      results.push(...(await run(names.slice(i, i + 12))))
      onPages(groupProbes(results, origin))
    }

    return groupProbes(results, origin)
  } catch {
    return null
  }
}

/**
 * Shows the slash pages as a list.
 *
 * @param {Array<{text: string, url: string, names: string[]}>} pages The pages.
 */
function showPages (pages) {
  show(el(
    'ul',
    {},
    ...pages.map((page) => el(
      'li',
      {},
      el('a', { href: page.url, title: page.url }, page.text),
      page.names.length ? el('div', { class: 'names' }, ...page.names.map((name) => el('span', { class: 'name' }, name))) : ''
    ))
  ))
}

/**
 * Creates an element. Text is added as text, never as markup.
 *
 * @param {string}           name       The tag name.
 * @param {Object}           attributes The attributes.
 * @param {...(Node|string)} children   The children.
 * @returns {Element} The element.
 */
function el (name, attributes = {}, ...children) {
  const element = document.createElement(name)

  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, value)
  }

  element.append(...children)

  return element
}

/**
 * Replaces the content of the popup.
 *
 * @param {...(Node|string)} children The new content.
 */
function show (...children) {
  document.getElementById('content').replaceChildren(...children)
}

/**
 * Opens a link in a new tab and closes the popup.
 *
 * @param {Event} event The click event.
 */
function open (event) {
  const link = event.target.closest('a[href]')

  if (!link) {
    return
  }

  event.preventDefault()
  api.tabs.create({ url: link.href })
  window.close()
}

async function main () {
  document.addEventListener('click', open)

  const [tab] = await api.tabs.query({ active: true, currentWindow: true })
  let url

  try {
    url = new URL(tab.url)
  } catch {
    url = null
  }

  if (!url || !['http:', 'https:'].includes(url.protocol)) {
    show(el('p', { class: 'muted' }, 'Slash pages are only available on websites.'))
    return
  }

  document.getElementById('site').textContent = url.host

  const xml = await fetchOpml(tab.id, url.origin)
  const opml = xml ? parseSlashpages(xml, url.origin + PATH) : null

  if (!opml) {
    show(el('p', { class: 'muted' }, 'This site has no /.well-known/slashpages, looking for known slash pages…'))

    const note = 'No /.well-known/slashpages, these were found by trying the known paths.'
    const pages = await probe(tab.id, url.origin, (found) => {
      if (found.length) {
        showPages(found)
        document.getElementById('content').prepend(el('p', { class: 'muted note' }, note))
        document.getElementById('content').append(el('p', { class: 'muted note' }, 'Still looking…'))
      }
    })

    if (!pages) {
      show(el('p', { class: 'muted' }, 'This site has no /.well-known/slashpages, and it answers every path, so the slash pages can not be guessed.'))
      return
    }

    if (!pages.length) {
      show(el('p', { class: 'muted' }, 'This site has no /.well-known/slashpages and none of the known slash pages.'))
      return
    }

    showPages(pages)
    document.getElementById('content').prepend(el('p', { class: 'muted note' }, note))
    return
  }

  const source = document.getElementById('source')
  source.href = url.origin + PATH
  source.hidden = false

  if (opml.title) {
    document.getElementById('title').textContent = opml.title
  }

  if (!opml.pages.length) {
    show(el('p', { class: 'muted' }, 'The list of slash pages is empty.'))
    return
  }

  showPages(opml.pages)
}

main()
