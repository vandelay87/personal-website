import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import SocialCard from './SocialCard'

describe('SocialCard', () => {
  it('renders the card heading', () => {
    render(<SocialCard />)
    expect(screen.getByRole('heading', { name: /connect with me/i })).toBeInTheDocument()
  })

  it('renders a list of social links', () => {
    render(<SocialCard />)
    const list = screen.getByRole('list')
    expect(list).toBeInTheDocument()
    const items = screen.getAllByRole('listitem')
    expect(items.length).toBe(3)
  })

  it('renders GitHub, LinkedIn, and Email links with correct hrefs', () => {
    render(<SocialCard />)
    expect(screen.getByRole('link', { name: /github/i })).toHaveAttribute(
      'href',
      'https://github.com/vandelay87'
    )
    expect(screen.getByRole('link', { name: /linkedin/i })).toHaveAttribute(
      'href',
      'https://www.linkedin.com/in/akli-aissat-b08119115/'
    )
    expect(screen.getByRole('link', { name: /email/i })).toHaveAttribute(
      'href',
      'mailto:akliaissat@outlook.com?subject=Hello'
    )
  })

  it('links open in a new tab with proper rel attributes', () => {
    render(<SocialCard />)
    const links = screen.getAllByRole('link')
    links.forEach((link) => {
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })
  })

  it('renders visually hidden text for accessibility', () => {
    render(<SocialCard />)
    expect(screen.getByText('GitHub', { selector: '.sr-only' })).toBeInTheDocument()
    expect(screen.getByText('LinkedIn', { selector: '.sr-only' })).toBeInTheDocument()
    expect(screen.getByText('Email', { selector: '.sr-only' })).toBeInTheDocument()
  })
})
