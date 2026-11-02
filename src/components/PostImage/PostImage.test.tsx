import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { axe } from 'vitest-axe'
import PostImage from './PostImage'

describe('PostImage', () => {
  it('requests the medium and full variants of the post image by default', () => {
    render(<PostImage slug="a-post" stem="screenshot" alt="A screenshot" />)

    const img = screen.getByRole('img', { name: 'A screenshot' })
    expect(img).toHaveAttribute('src', 'https://images.akli.dev/blog/a-post/screenshot-medium.webp')
    expect(img).toHaveAttribute(
      'srcset',
      'https://images.akli.dev/blog/a-post/screenshot-medium.webp 800w, https://images.akli.dev/blog/a-post/screenshot-full.webp 1200w'
    )
  })

  it('uses the first of the given variants as src and lists all of them in srcset', () => {
    render(<PostImage slug="a-post" stem="mobile" variants={['thumb', 'medium']} alt="A mobile view" />)

    const img = screen.getByRole('img', { name: 'A mobile view' })
    expect(img).toHaveAttribute('src', 'https://images.akli.dev/blog/a-post/mobile-thumb.webp')
    expect(img).toHaveAttribute(
      'srcset',
      'https://images.akli.dev/blog/a-post/mobile-thumb.webp 400w, https://images.akli.dev/blog/a-post/mobile-medium.webp 800w'
    )
  })

  it('passes the remaining image props through', () => {
    const { container } = render(
      <PostImage slug="a-post" stem="screenshot" alt="A screenshot" caption="A caption" maxWidth="400px" />
    )

    expect(screen.getByText('A caption')).toBeInTheDocument()
    expect(container.querySelector('figure')).toHaveStyle({ maxWidth: '400px' })
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<PostImage slug="a-post" stem="screenshot" alt="A screenshot" caption="A caption" />)

    expect(await axe(container)).toHaveNoViolations()
  })
})
