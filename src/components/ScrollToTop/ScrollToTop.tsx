import { useEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

export default function ScrollToTop() {
  const { pathname, hash } = useLocation()
  const navigationType = useNavigationType()
  const prevPathnameRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    const isInitialMount = prevPathnameRef.current === undefined
    const pathnameChanged = !isInitialMount && prevPathnameRef.current !== pathname
    prevPathnameRef.current = pathname

    // A search-param-only change (e.g. a filter chip's ?tag=) re-fires this
    // effect too — navigationType flips POP -> PUSH on the first such
    // change and then stays PUSH, so relying on navigationType alone only
    // catches this on the first occurrence. Skip anything that isn't the
    // initial mount or an actual route (pathname) change.
    if (!isInitialMount && !pathnameChanged) {
      return
    }

    // Only scroll to top on new navigations (link clicks), not back/forward
    if (navigationType !== 'POP') {
      if (hash) {
        try {
          const element = document.querySelector(hash)
          if (element) {
            element.scrollIntoView()
            // SC 2.4.3: move focus to the anchor target too, mirroring the
            // #main focus below, so keyboard/screen-reader users land on
            // the scrolled-to content instead of staying on the old focus
            // target. preventScroll avoids fighting scrollIntoView above.
            ;(element as HTMLElement).focus({ preventScroll: true })
            return
          }
        } catch {
          // Invalid CSS selector from hash fragment — fall through to scrollTo
        }
      }
      window.scrollTo(0, 0)
      // SC 2.4.3: move focus to the main landmark (which contains the page's
      // <h1>) after a client-side route change, so keyboard/screen-reader
      // users get the new page's context instead of staying on the old
      // focus target. preventScroll avoids fighting the scrollTo above.
      document.getElementById('main')?.focus({ preventScroll: true })
    }
  }, [pathname, hash, navigationType])

  return null
}
