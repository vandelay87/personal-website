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
    }
  }, [pathname, hash, navigationType])

  return null
}
