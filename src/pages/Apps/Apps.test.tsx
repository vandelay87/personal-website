import type { AppCardProps } from '@components/AppCard'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import { axe } from 'vitest-axe'
import Apps from './Apps'

vi.mock('@components/AppCard', () => ({
  default: ({ title, description, href }: AppCardProps) => (
    <article data-testid="card-mock">
      <h2>{title}</h2>
      <p>{description}</p>
      <a href={href}>{href}</a>
    </article>
  ),
}))

const renderApps = () =>
  render(
    <MemoryRouter>
      <Apps />
    </MemoryRouter>
  )

describe('Apps', () => {
  it('renders a single page heading', () => {
    renderApps()
    expect(
      screen.getByRole('heading', { level: 1, name: 'Apps' })
    ).toBeInTheDocument()
  })

  it('renders the app cards inside a list', () => {
    renderApps()
    const list = screen.getByRole('list')
    expect(list).toBeInTheDocument()
    expect(screen.getAllByTestId('card-mock')).toHaveLength(2)
  })

  it('renders a pluralized count label for multiple apps', () => {
    renderApps()
    expect(screen.getByText('2 apps')).toBeInTheDocument()
  })

  it('renders the correct card description', () => {
    renderApps()
    expect(
      screen.getByText(
        'Real-time particle physics simulation of falling sand grains on a black canvas.'
      )
    ).toBeInTheDocument()
  })

  it('renders the correct card href', () => {
    renderApps()
    expect(
      screen.getByRole('link', { name: 'https://akli.dev/apps/sand-box' })
    ).toBeInTheDocument()
  })

  it('renders the Pokedex card with correct title, description, and link', () => {
    renderApps()
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

  it('renders an "In progress" aside with a link to the blog', () => {
    renderApps()
    expect(screen.getByText(/in progress/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /read the blog/i })).toHaveAttribute(
      'href',
      '/blog'
    )
  })

  it('renders content with no detectable axe violations', async () => {
    const { container } = renderApps()
    expect(await axe(container)).toHaveNoViolations()
  })
})
