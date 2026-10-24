import { parseSlashpages } from '../opml.js'

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
    const response = await fetch(url, { credentials: 'omit' })
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
    const response = await fetch(origin + PATH, { credentials: 'omit' })
    return response.ok ? await response.text() : null
  } catch {
    return null
  }
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
    show(el('p', { class: 'muted' }, 'This site has no /.well-known/slashpages.'))
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

  show(el(
    'ul',
    {},
    ...opml.pages.map((page) => el(
      'li',
      {},
      el('a', { href: page.url, title: page.url }, page.text),
      page.names.length ? el('div', { class: 'names' }, ...page.names.map((name) => el('span', { class: 'name' }, name))) : ''
    ))
  ))
}

main()
