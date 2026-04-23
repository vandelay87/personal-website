import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ProcessingPlaceholder from './ProcessingPlaceholder'
import styles from './ProcessingPlaceholder.module.css'

/**
 * Swap `window.matchMedia` with a mock whose `matches` tracks whatever
 * `(prefers-reduced-motion: reduce)` is asked about. Anything else returns false.
 */
const stubMatchMedia = (prefersReducedMotion: boolean): void => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches:
        query === '(prefers-reduced-motion: reduce)'
          ? prefersReducedMotion
          : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  )
}

describe('ProcessingPlaceholder', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders the default "Processing image…" caption', () => {
    stubMatchMedia(false)

    render(<ProcessingPlaceholder />)

    expect(screen.getByText(/processing image/i)).toBeInTheDocument()
  })

  it('renders the overridden caption and hides the default', () => {
    stubMatchMedia(false)

    render(<ProcessingPlaceholder caption="Resizing cover…" />)

    expect(screen.getByText('Resizing cover…')).toBeInTheDocument()
    expect(screen.queryByText(/processing image/i)).not.toBeInTheDocument()
  })

  it('does not carry aria-live on its root or any descendant', () => {
    stubMatchMedia(false)

    const { container } = render(<ProcessingPlaceholder />)

    const root = container.firstElementChild
    expect(root).not.toBeNull()
    expect(root).not.toHaveAttribute('aria-live')

    // Announcements are routed via a page-level region (see PRD) —
    // no descendant of the placeholder should carry aria-live either.
    const descendantsWithAriaLive = container.querySelectorAll('[aria-live]')
    expect(descendantsWithAriaLive).toHaveLength(0)
  })

  it('forwards the className prop to its outer element', () => {
    stubMatchMedia(false)

    const { container } = render(<ProcessingPlaceholder className="foo" />)

    const root = container.firstElementChild
    expect(root).toHaveClass('foo')
  })

  it('applies the aspectRatio prop via inline style', () => {
    stubMatchMedia(false)

    const { container } = render(
      <ProcessingPlaceholder aspectRatio="16/9" />,
    )

    const root = container.firstElementChild as HTMLElement | null
    expect(root).not.toBeNull()
    expect(root).toHaveStyle({ aspectRatio: '16/9' })
  })

  it('does not apply the reduced-motion class when prefers-reduced-motion is not set', () => {
    stubMatchMedia(false)

    const { container } = render(<ProcessingPlaceholder />)

    const root = container.firstElementChild
    expect(root).not.toHaveClass(styles.reducedMotion)
  })

  it('applies the reduced-motion class when prefers-reduced-motion: reduce matches', () => {
    stubMatchMedia(true)

    const { container } = render(<ProcessingPlaceholder />)

    const root = container.firstElementChild
    expect(root).toHaveClass(styles.reducedMotion)
  })
})
