/**
 * Shared engine utilities — keep side-effect-free.
 */

/** Generates a collision-resistant unique build ID. */
export function newId(): string {
  return `build_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

/**
 * Constructs the Questlog screenshot URL from a regular character-builder URL.
 * Inserts /screenshot before the query string.
 *
 * Input:  https://questlog.gg/.../character-builder/NAME?buildId=123
 * Output: https://questlog.gg/.../character-builder/NAME/screenshot?buildId=123
 */
export function buildScreenshotUrl(buildUrl: string): string {
  try {
    const url = new URL(buildUrl)
    if (!url.pathname.endsWith('/screenshot')) {
      url.pathname = url.pathname.replace(/\/$/, '') + '/screenshot'
    }
    return url.toString()
  } catch {
    // Fallback: naive string insertion
    const qi = buildUrl.indexOf('?')
    if (qi > -1) return buildUrl.slice(0, qi) + '/screenshot' + buildUrl.slice(qi)
    return buildUrl + '/screenshot'
  }
}
