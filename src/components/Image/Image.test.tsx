import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Image from './Image'

const mockIntersectionObserver = vi
  .fn()
  .mockImplementation((callback: IntersectionObserverCallback) => ({
    observe: vi.fn((element: Element) => {
      callback(
        [{ isIntersecting: true, target: element } as IntersectionObserverEntry],
        {} as IntersectionObserver
      )
    }),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
    root: null,
    rootMargin: '',
    thresholds: [],
  }))

window.IntersectionObserver = mockIntersectionObserver as unknown as typeof IntersectionObserver

describe('Image', () => {
  const defaultProps = {
    src: 'https://example.com/test.jpg',
    alt: 'Test Image',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    document.head.innerHTML = ''
  })

  it('renders correctly and shows placeholder initially', () => {
    render(<Image {...defaultProps} />)

    // Find the image by alt text
    const img = screen.getByAltText('Test Image')
    expect(img).toBeInTheDocument()
    expect(img).toHaveClass('opacity-0')
  })

  it('removes placeholder and shows image on successful load', () => {
    render(<Image {...defaultProps} />)
    const img = screen.getByAltText('Test Image')

    fireEvent.load(img)
    expect(img).toHaveClass('opacity-100')
  })

  it('handles error state and switches to fallback image', () => {
    const fallback = 'https://example.com/fallback.jpg'
    render(<Image {...defaultProps} fallbackSrc={fallback} />)

    const img = screen.getByAltText('Test Image')
    fireEvent.error(img)

    expect(img).toHaveAttribute('src', fallback)
  })

  it('triggers preload and high priority for priority images', () => {
    render(<Image {...defaultProps} priority={true} />)

    const link = document.head.querySelector('link[rel="preload"]')
    expect(link).toHaveAttribute('href', defaultProps.src)

    const img = screen.getByAltText('Test Image')
    expect(img).toHaveAttribute('fetchpriority', 'high')
    expect(img).toHaveAttribute('loading', 'eager')
  })

  it('applies custom aspect ratio and object fit styles', () => {
    const { container } = render(
      <Image
        {...defaultProps}
        aspectRatio="16/9"
        objectFit="contain"
        containerClassName="custom-container"
      />
    )

    const figure = container.querySelector('figure')
    expect(figure).toHaveClass('custom-container')
    expect(figure?.style.aspectRatio).toBe('16/9')

    const img = screen.getByAltText('Test Image')
    expect(img).toHaveClass('object-contain')
  })
})
