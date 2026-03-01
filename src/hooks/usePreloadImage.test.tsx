import { render, waitFor, cleanup } from '@testing-library/react'
import { describe, it, expect, afterEach } from 'vitest'
import { usePreloadImage } from './usePreloadImage'

describe('usePreloadImage', () => {
  const SRC = 'https://example.com/test.jpg'

  afterEach(() => {
    // Clean up all preload links to prevent test leakage
    const links = document.head.querySelectorAll("link[rel='preload']")
    links.forEach((l) => l.remove())
    cleanup()
  })

  it('adds a preload link when src is provided', async () => {
    function Test() {
      usePreloadImage(SRC)
      return null
    }

    render(<Test />)

    // Check for the link by rel and href, which are more reliable in JSDOM
    const link = await waitFor(() => {
      const l = document.head.querySelector(`link[rel="preload"][href="${SRC}"]`)
      if (!l) throw new Error('no preload link')
      return l
    })

    expect(link).toBeDefined()
    expect(link.getAttribute('as')).toBe('image')
  })

  it('removes the preload link on unmount', async () => {
    function Test() {
      usePreloadImage(SRC)
      return null
    }

    const { unmount } = render(<Test />)

    // Wait for insertion
    await waitFor(() => {
      if (!document.head.querySelector(`link[href="${SRC}"]`)) {
        throw new Error('expected preload link to be present')
      }
    })

    unmount()

    // Wait for removal
    await waitFor(() => {
      if (document.head.querySelector(`link[href="${SRC}"]`)) {
        throw new Error('expected preload link to be removed')
      }
    })

    expect(document.head.querySelector(`link[href="${SRC}"]`)).toBeNull()
  })
})
