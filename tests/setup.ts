import '@testing-library/jest-dom'
import { configure } from '@testing-library/react'
import { vi } from 'vitest'

configure({ asyncUtilTimeout: 5000 })

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
