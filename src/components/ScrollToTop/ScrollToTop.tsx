import { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

export default function ScrollToTop() {
  const { pathname, hash } = useLocation()
  const navigationType = useNavigationType()

  useEffect(() => {
    // Only scroll to top on new navigations (link clicks), not back/forward
    if (navigationType !== 'POP') {
      if (hash) {
        try {
          const element = document.querySelector(hash)
          if (element) {
            element.scrollIntoView()
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
