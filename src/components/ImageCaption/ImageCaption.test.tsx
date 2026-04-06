import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ImageCaption from './ImageCaption'

describe('ImageCaption', () => {
  const defaultProps = {
    src: '/blog/images/architecture.png',
    alt: 'System architecture diagram',
  }

  it('renders image with correct src and alt', () => {
    render(<ImageCaption {...defaultProps} caption="Architecture overview" />)

    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', defaultProps.src)
    expect(img).toHaveAttribute('alt', defaultProps.alt)
  })

  it('renders caption text below the image', () => {
    render(
      <ImageCaption {...defaultProps} caption="The three-stack CDK architecture" />
    )

    expect(
      screen.getByText('The three-stack CDK architecture')
    ).toBeInTheDocument()
  })

  it('image is responsive with max-width style or class', () => {
    render(<ImageCaption {...defaultProps} caption="Responsive image" />)

    const img = screen.getByRole('img')
    const hasMaxWidth =
      img.style.maxWidth === '100%' ||
      img.className.match(/responsive|full|max/) !== null ||
      img.closest('figure')?.style.maxWidth === '100%'

    expect(hasMaxWidth).toBe(true)
  })

  it('renders without caption when caption is not provided', () => {
    const { container } = render(<ImageCaption {...defaultProps} />)

    const img = screen.getByRole('img')
    expect(img).toBeInTheDocument()

    // Should not render a figcaption element when no caption is provided
    const figcaption = container.querySelector('figcaption')
    expect(figcaption).not.toBeInTheDocument()
  })
})
