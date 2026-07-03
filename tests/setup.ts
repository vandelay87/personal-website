import '@testing-library/jest-dom'
import { expect, vi } from 'vitest'
import * as matchers from 'vitest-axe/matchers'

// Register vitest-axe's `toHaveNoViolations` matcher project-wide. Note: axe
// cannot evaluate `color-contrast` under jsdom (no real layout/rendering), so
// that rule is inherently unreliable in this environment.
expect.extend(matchers)

// Shim `jest` global so @testing-library's `waitFor` detects vitest's fake
// timers (it checks `typeof jest !== 'undefined'` plus `setTimeout.clock`).
// Without this, `waitFor` silently hangs under `vi.useFakeTimers()`.
;(globalThis as unknown as { jest: { advanceTimersByTime: (ms: number) => void } }).jest = {
  advanceTimersByTime: (ms: number) => vi.advanceTimersByTime(ms),
}

export class MockIntersectionObserver {
  observe: ReturnType<typeof vi.fn>
  unobserve = vi.fn()
  disconnect = vi.fn()
  root = null
  rootMargin = ''
  thresholds = []

  constructor(callback: IntersectionObserverCallback) {
    this.observe = vi.fn((element: Element) => {
      callback(
        [{ isIntersecting: true, target: element } as IntersectionObserverEntry],
        {} as IntersectionObserver
      )
    })
  }
}

if (typeof window !== 'undefined') {
  window.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver
}

// jsdom does not implement the native <dialog> element's `showModal`/`close`
// behaviour. This minimal polyfill toggles the `open` attribute and dispatches
// a `close` event so components built on native <dialog> (e.g. a future
// ConfirmDialog rebuild) can be tested without a headless-browser dependency.
if (typeof HTMLDialogElement !== 'undefined') {
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    this.open = true
  }

  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement, returnValue?: string) {
    if (returnValue !== undefined) {
      this.returnValue = returnValue
    }
    this.open = false
    this.dispatchEvent(new Event('close'))
  }
}
