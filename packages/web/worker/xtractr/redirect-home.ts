/**
 * A link to a page that ends, after its redirects, on another site's home
 * page was not followed to its content: the site turned the request away
 * (as Instagram does, to Facebook). Short links still resolve, since they
 * lead to a page with a path.
 */
export const isRedirectToOtherHomePage = (from: string, to: string) => {
  try {
    const source = new URL(from)
    const target = new URL(to)
    const hostOf = (value: URL) => value.hostname.replace(/^www\./, '')

    return (
      hostOf(source) !== hostOf(target) &&
      source.pathname.length > 1 &&
      target.pathname === '/' &&
      !target.search
    )
  } catch {
    return false
  }
}
