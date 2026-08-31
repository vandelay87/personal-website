import type { AppCardProps } from '@components/AppCard'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import { axe } from 'vitest-axe'
import Apps from './Apps'

vi.mock('@components/AppCard', () => ({
  default: ({ title, description, href, image }: AppCardProps) => (
    <article data-testid="card-mock">
      <h2>{title}</h2>
      <p>{description}</p>
      <a href={href}>{href}</a>
      <img src={image.src} srcSet={image.srcSet} alt={image.alt} />
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
      screen.getByRole('heading', { level: 1, name: 'A few things I built for fun.' })
    ).toBeInTheDocument()
  })

  it('renders the app cards inside a list', () => {
    renderApps()
    const list = screen.getByRole('list')
    expect(list).toBeInTheDocument()
    expect(screen.getAllByTestId('card-mock')).toHaveLength(3)
  })

  it('renders a pluralized count label for multiple apps', () => {
    renderApps()
    expect(screen.getByText('3 apps')).toBeInTheDocument()
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
      screen.getByRole('link', { name: 'https://sandbox.akli.dev' })
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
      screen.getByRole('link', { name: 'https://pokedex.akli.dev' })
    ).toBeInTheDocument()
  })

  it('renders the Storybook card with correct title, description, and link', () => {
    renderApps()
    expect(screen.getByText('Storybook')).toBeInTheDocument()
    expect(
      screen.getByText('The interactive design system and component catalog for akli.dev.')
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'https://storybook.akli.dev' })
    ).toBeInTheDocument()
  })

  it('orders the cards most-recent-first: Storybook, Pokedex, Sand box', () => {
    renderApps()
    const headings = screen.getAllByRole('heading', { level: 2 })
    expect(headings.map((heading) => heading.textContent)).toEqual([
      'Storybook',
      'Pokedex',
      'Sand box',
    ])
  })

  it('passes a responsive srcSet through to the Storybook card image, generated via vite-imagetools', () => {
    renderApps()
    const storybookHeading = screen.getByRole('heading', { name: 'Storybook' })
    const storybookCard = storybookHeading.closest('article')
    expect(storybookCard).not.toBeNull()

    const image = within(storybookCard as HTMLElement).getByRole('img')
    const srcSet = image.getAttribute('srcSet') ?? image.getAttribute('srcset')
    expect(srcSet).toBeTruthy()
    expect(srcSet?.split(',').length).toBeGreaterThan(1)
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
