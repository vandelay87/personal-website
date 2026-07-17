import { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

import { MAIN_LANDMARK_ID } from '../../constants/mainLandmark'

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
      document.getElementById(MAIN_LANDMARK_ID)?.focus({ preventScroll: true })
    }
    // navigationType is read above but deliberately left out of these deps —
    // it's consulted, not reacted to. A search-param-only change (e.g. a
    // filter chip's ?tag=) doesn't touch pathname/hash, so this effect
    // correctly won't re-run for it; but navigationType itself still flips
    // POP -> PUSH on that first such change, and if it were a dependency
    // this effect would spuriously re-run (and scroll to top) for that one
    // change alone, even though neither pathname nor hash actually changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, hash])

  return null
}
