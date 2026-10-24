/**
 * Groups the answers of probed slash page paths into pages.
 *
 * A path counts if it answered with a success status on the same path, with
 * or without a trailing slash. Redirects to other paths do not count, e.g.
 * WordPress redirects an unknown /hello to a post with a similar slug, and
 * many sites redirect unknown paths to the front page.
 *
 * @param {Array<{name: string, ok: boolean, url: string}>} results The answers, in list order.
 * @param {string} origin The origin of the site.
 * @returns {Array<{text: string, url: string, names: string[]}>} The pages.
 */
export function groupProbes (results, origin) {
  const pages = new Map()

  for (const { name, ok, url } of results) {
    let final

    try {
      final = new URL(url)
    } catch {
      continue
    }

    const path = final.pathname.replace(/\/$/, '').toLowerCase()

    if (!ok || final.origin !== origin || path !== '/' + name) {
      continue
    }

    final.hash = ''

    if (!pages.has(final.href)) {
      pages.set(final.href, { text: '/' + name, url: final.href, names: [] })
    }

    pages.get(final.href).names.push('/' + name)
  }

  return Array.from(pages.values())
}
