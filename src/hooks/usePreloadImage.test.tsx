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
      usePreloadImage(SRC, { fetchPriority: 'high' })
      return null
    }

    render(<Test />)

    const link = await waitFor(() => {
      const l = document.head.querySelector(`link[rel="preload"][href="${SRC}"]`)
      if (!l) throw new Error('no preload link')
      return l
    })

    expect(link.getAttribute('as')).toBe('image')
    expect(link.getAttribute('fetchpriority')).toBe('high')
  })

  it('applies imagesrcset and imagesizes attributes correctly', async () => {
    const SRCSET = 'small.jpg 300w, large.jpg 1000w'
    const SIZES = '100vw'

    function Test() {
      usePreloadImage(SRC, { srcSet: SRCSET, sizes: SIZES })
      return null
    }

    render(<Test />)

    const link = await waitFor(() => {
      const l = document.head.querySelector(`link[rel="preload"][href="${SRC}"]`)
      if (!l) throw new Error('no preload link')
      return l
    })

    expect(link.getAttribute('imagesrcset')).toBe(SRCSET)
    expect(link.getAttribute('imagesizes')).toBe(SIZES)
  })

  // NEW TEST: Verify duplicate prevention
  it('does not add duplicate links for the same src', async () => {
    function Test() {
      usePreloadImage(SRC)
      return null
    }

    // Render twice (or two components)
    render(
      <>
        <Test />
        <Test />
      </>
    )

    await waitFor(() => {
      const links = document.head.querySelectorAll(`link[href="${SRC}"]`)
      expect(links.length).toBe(1)
    })
  })

  it('removes the preload link on unmount', async () => {
    function Test() {
      usePreloadImage(SRC)
      return null
    }

    const { unmount } = render(<Test />)

    await waitFor(() => {
      if (!document.head.querySelector(`link[href="${SRC}"]`)) {
        throw new Error('expected preload link to be present')
      }
    })

    unmount()

    await waitFor(() => {
      const link = document.head.querySelector(`link[href="${SRC}"]`)
      if (link) throw new Error('expected preload link to be removed')
    })

    expect(document.head.querySelector(`link[href="${SRC}"]`)).toBeNull()
  })
})
