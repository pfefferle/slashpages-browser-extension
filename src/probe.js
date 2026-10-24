/**
 * Groups the answers of probed slash page paths into pages.
 *
 * A path counts if it answered with a success status and did not end up on
 * the front page (a common soft 404). Paths that end up on the same URL are
 * one page with several names, e.g. /log redirecting to /changelog/.
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

    if (!ok || final.origin !== origin || final.pathname === '/') {
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
