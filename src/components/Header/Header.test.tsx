import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Header from './Header'

vi.mock('@components/Navigation', () => ({
  default: () => <nav data-testid="navigation" />,
}))
vi.mock('@components/ThemeToggle', () => ({
  default: () => <button data-testid="theme-toggle" />,
}))

describe('Header', () => {
  it('renders the header element', () => {
    render(<Header />)
    const header = screen.getByRole('banner')
    expect(header).toBeInTheDocument()
  })

  it('renders the Navigation component', () => {
    render(<Header />)
    expect(screen.getByTestId('navigation')).toBeInTheDocument()
  })

  it('renders the ThemeToggle component', () => {
    render(<Header />)
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument()
  })
})
