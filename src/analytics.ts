// Google Analytics 4. Loaded from here (not index.html) so the id lives in one
// place and local development stays out of the numbers.

const GA_ID = 'G-K0W8NCFQ5F' // e.g. 'G-XXXXXXXXXX' — empty disables analytics entirely

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (...args: unknown[]) => void
  }
}

const isLocal = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)
const enabled = !!GA_ID && !isLocal

export function initAnalytics() {
  if (!enabled) return
  const s = document.createElement('script')
  s.async = true
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
  document.head.appendChild(s)

  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments)
  }
  window.gtag('js', new Date())
  // The app is a single page with hash routes, so page views are sent manually.
  window.gtag('config', GA_ID, { send_page_view: false, anonymize_ip: true })
}

/** Hash route → a readable page path, with ids stripped so pages group together. */
export function trackPage(path: string) {
  if (!enabled) return
  const clean = path
    .replace(/\/tape\/[^/]+\/take\/[^/]+$/, '/tape/:id/take/:id')
    .replace(/\/tape\/[^/]+\/take\/new$/, '/tape/:id/take/new')
    .replace(/\/tape\/[^/]+\/edit$/, '/tape/:id/edit')
    .replace(/\/tape\/[^/]+$/, '/tape/:id')
  window.gtag('event', 'page_view', { page_path: clean, page_title: clean })
}

/**
 * Product events. Only counts and scores are sent — never project names, roles,
 * notes, intentions or video, which stay in the actor's browser.
 */
export function track(event: string, params: Record<string, string | number | boolean> = {}) {
  if (!enabled) return
  window.gtag('event', event, params)
}
