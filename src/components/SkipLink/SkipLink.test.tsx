import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import SkipLink from './SkipLink'

describe('SkipLink', () => {
  it('renders a link with the visible "Skip to main content" text pointing at #main', () => {
    render(<SkipLink />)

    const link = screen.getByRole('link', { name: 'Skip to main content' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '#main')
  })

  it('points at a custom targetId when provided', () => {
    render(<SkipLink targetId="content" />)

    expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveAttribute(
      'href',
      '#content'
    )
  })
})
