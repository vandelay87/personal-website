import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import About from './About'

vi.mock('@components/SocialCard', () => ({
  default: () => <div data-testid="social-card" />,
}))

describe('About', () => {
  it('renders the About heading', () => {
    render(<About />)
    expect(screen.getByRole('heading', { name: /about/i })).toBeInTheDocument()
  })

  it('renders the description paragraph', () => {
    render(<About />)
    expect(screen.getByText(/this website is a work in progress/i)).toBeInTheDocument()
  })

  it('renders the SocialCard component', () => {
    render(<About />)
    expect(screen.getByTestId('social-card')).toBeInTheDocument()
  })
})
