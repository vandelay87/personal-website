import type { CardProps } from '@components/Card'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, it, expect, vi } from 'vitest'
import Apps from './Apps'

vi.mock('@components/Card', () => ({
  default: ({ title, description, href }: CardProps) => (
    <div data-testid="card-mock">
      <h3>{title}</h3>
      <p>{description}</p>
      <a href={href}>{href}</a>
    </div>
  ),
}))

vi.mock('@components/Grid', () => ({
  default: ({ children }: { children: ReactNode }) => (
    <ul data-testid="grid-mock">{children}</ul>
  ),
}))

describe('Apps', () => {
  it('renders the page heading', () => {
    render(<Apps />)
    expect(
      screen.getByRole('heading', { level: 1, name: 'Apps' })
    ).toBeInTheDocument()
  })

  it('renders the Grid component', () => {
    render(<Apps />)
    expect(screen.getByTestId('grid-mock')).toBeInTheDocument()
  })

  it('renders the correct card description', () => {
    render(<Apps />)
    expect(
      screen.getByText(
        'Real-time particle physics simulation of falling sand grains on a black canvas.'
      )
    ).toBeInTheDocument()
  })

  it('renders the correct card href', () => {
    render(<Apps />)
    expect(
      screen.getByRole('link', { name: 'https://akli.dev/apps/sand-box' })
    ).toBeInTheDocument()
  })

  it('renders the Pokedex card with correct title, description, and link', () => {
    render(<Apps />)
    expect(screen.getByText('Pokedex')).toBeInTheDocument()
    expect(
      screen.getByText(
        'A searchable encyclopedia of Gen 1 Pokemon, styled after the classic Game Boy Color Pokedex.'
      )
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'https://akli.dev/apps/pokedex' })
    ).toBeInTheDocument()
  })
})
