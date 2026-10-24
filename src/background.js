import { countSlashpages } from './opml.js'

// Firefox and Safari have `browser`, Chrome only `chrome`.
const api = globalThis.browser || globalThis.chrome

const PATH = '/.well-known/slashpages'

// How long the result for a site is kept, in milliseconds.
const TTL = 10 * 60 * 1000

const ICON = { 16: '/icons/icon-16.png', 32: '/icons/icon-32.png' }
const GREY = { 16: '/icons/icon-grey-16.png', 32: '/icons/icon-grey-32.png' }

const cache = new Map()

/**
 * Counts the slash pages of a site, from its /.well-known/slashpages.
 *
 * @param {string} origin The origin of the site.
 * @returns {Promise<number|null>} The number of slash pages, or null without a well-known.
 */
function count (origin) {
  const cached = cache.get(origin)

  if (cached && Date.now() - cached.time < TTL) {
    return cached.count
  }

  const result = fetch(origin + PATH, { credentials: 'omit' })
    .then((response) => (response.ok ? response.text() : null))
    .then((xml) => (xml === null ? null : countSlashpages(xml)))
    .catch(() => null)

  cache.set(origin, { time: Date.now(), count: result })

  return result
}

/**
 * Shows on the icon of a tab whether its site has slash pages.
 *
 * Only if the extension may access the site. The access to all sites is
 * asked for at install, but can be turned off in the browser.
 *
 * @param {number} tabId The tab.
 * @param {string} url   The URL of the tab.
 */
async function update (tabId, url) {
  let origin = null

  try {
    const parsed = new URL(url)
    origin = ['http:', 'https:'].includes(parsed.protocol) ? parsed.origin : null
  } catch {
    origin = null
  }

  try {
    if (!origin || !(await api.permissions.contains({ origins: [origin + '/*'] }))) {
      await api.action.setIcon({ tabId, path: ICON })
      await api.action.setBadgeText({ tabId, text: '' })
      return
    }

    const number = await count(origin)

    await api.action.setIcon({ tabId, path: number === null ? GREY : ICON })
    await api.action.setBadgeText({ tabId, text: number ? String(number) : '' })
  } catch {
    // The tab was closed in the meantime.
  }
}

/**
 * Updates all open tabs, after the access to sites was changed.
 */
async function updateAll () {
  cache.clear()

  for (const tab of await api.tabs.query({})) {
    update(tab.id, tab.url)
  }
}

api.action.setBadgeBackgroundColor({ color: '#2271b1' })

api.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' || changeInfo.url) {
    update(tabId, tab.url)
  }
})

api.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    const tab = await api.tabs.get(tabId)
    update(tabId, tab.url)
  } catch {
    // The tab is gone.
  }
})

api.permissions.onAdded.addListener(updateAll)
api.permissions.onRemoved.addListener(updateAll)

// The tabs that were open before the extension started.
updateAll()
