import { useEffect, useState } from 'react'
import { trackPage } from './analytics'

const current = () => window.location.hash.replace(/^#/, '') || '/'

export function useRoute() {
  const [path, setPath] = useState(current)
  useEffect(() => {
    trackPage(current())
    const on = () => {
      const next = current()
      setPath(next)
      trackPage(next)
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return path
}

export const go = (path: string) => {
  window.location.hash = path
}

/** Match "/tape/:id/take/:takeId" style patterns. */
export function match(pattern: string, path: string): Record<string, string> | null {
  const p = pattern.split('/')
  const a = path.split('/')
  if (p.length !== a.length) return null
  const params: Record<string, string> = {}
  for (let i = 0; i < p.length; i++) {
    if (p[i].startsWith(':')) params[p[i].slice(1)] = decodeURIComponent(a[i])
    else if (p[i] !== a[i]) return null
  }
  return params
}
