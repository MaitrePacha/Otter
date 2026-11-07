// Where sites send a request they refuse: a sign-in or sign-up page, a
// check, or a page saying the browser is not supported
const WALL_PATH =
  /(^|\/)(login|log-in|signin|sign-in|sign_in|signup|sign-up|accounts\/login|authwall|unsupportedbrowser|checkpoint|challenge)(\/|\.php|$)/i

const isWallPath = (url: URL) => WALL_PATH.test(url.pathname)

// A link to a given page, rather than to a site's home or sign-in page,
// which can be bookmarked for what they are
const isLinkToContent = (url: URL) =>
  url.pathname.length > 1 && !isWallPath(url)

/**
 * Whether a link to a page was turned away by its redirects: one of them
 * (`hops`, the final URL last) leads to a sign-in, sign-up, check or
 * unsupported-browser page, or it ends on a site's home page (its bare
 * address, as facebook.com/ for an Instagram post). Links to a home or a
 * sign-in page themselves, and short links that lead to a page, resolve.
 */
export const isTurnedAway = (from: string, hops: string[]) => {
  try {
    const source = new URL(from)

    if (!isLinkToContent(source)) {
      return false
    }

    return hops.some((hop) => {
      const target = new URL(hop)

      if (target.href === source.href) {
        return false
      }

      return isWallPath(target) || (target.pathname === '/' && !target.search)
    })
  } catch {
    return false
  }
}
