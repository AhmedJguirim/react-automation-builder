/**
 * A minimal history-API router — enough for `/` and `/workflow/:id` without
 * pulling in a routing dependency. The <Link> that goes with it lives in
 * components/Link.tsx, so this file stays free of components.
 */
import { useEffect, useState } from 'react'

export function navigate(to: string): void {
  if (to === window.location.pathname) {
    return
  }
  window.history.pushState({}, '', to)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export function usePathname(): string {
  const [pathname, setPathname] = useState(window.location.pathname)

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname)
    window.addEventListener('popstate', onPopState)

    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  return pathname
}
