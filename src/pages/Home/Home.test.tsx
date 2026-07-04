import { fetchRecipes } from '@api/recipes'
import type { RecipeIndex } from '@models/recipe'
import { render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { axe } from 'vitest-axe'
import Home from './Home'

vi.mock('@api/recipes', () => ({
  fetchRecipes: vi.fn(),
}))

const mockRecipes: RecipeIndex[] = [
  {
    id: 'rec-001',
    title: 'Classic Margherita Pizza',
    slug: 'classic-margherita-pizza',
    coverImage: { alt: 'Margherita pizza', processedAt: 1_700_000_000_000 },
    tags: ['Italian', 'Quick'],
    prepTime: 15,
    cookTime: 12,
    servings: 4,
    createdAt: '2026-03-20T10:00:00Z',
  },
]

const renderHome = () =>
  render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  )

describe('Home', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(fetchRecipes).mockResolvedValue(mockRecipes)
  })

  it('renders a single h1 with the name', () => {
    renderHome()
    expect(
      screen.getByRole('heading', { level: 1, name: 'Akli Aissat' })
    ).toBeInTheDocument()
  })

  it('displays the role', () => {
    renderHome()
    expect(screen.getByText('Full-stack engineer')).toBeInTheDocument()
  })

  it('displays plain, non-hyperbolic bio copy', () => {
    renderHome()
    expect(
      screen.getByText(/I build web applications with React, TypeScript, and AWS/i)
    ).toBeInTheDocument()
    expect(screen.queryByText(/beautiful/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/passionate/i)).not.toBeInTheDocument()
  })

  it('renders the profile image with real alt text', () => {
    renderHome()
    const img = screen.getByRole('img', { name: 'Portrait of Akli Aissat' })
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', expect.stringContaining('profile'))
  })

  it('renders an Email me CTA linking to mailto', () => {
    renderHome()
    const link = screen.getByRole('link', { name: 'Email me' })
    expect(link).toHaveAttribute('href', expect.stringContaining('mailto:akliaissat@outlook.com'))
  })

  it('renders a Download CV CTA', () => {
    renderHome()
    const link = screen.getByRole('link', { name: 'Download CV' })
    expect(link).toHaveAttribute('download')
  })

  it('renders the Apps & experiments link section as a list of rows', () => {
    renderHome()
    const heading = screen.getByRole('heading', { level: 2, name: /apps & experiments/i })
    expect(heading).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Pokedex' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Sand box' })).toBeInTheDocument()

    const section = heading.closest('section')!
    expect(within(section).getByRole('link', { name: 'All' })).toHaveAttribute('href', '/apps')
  })

  it('renders the blog link section with post rows', () => {
    renderHome()
    expect(screen.getByRole('heading', { level: 2, name: /the blog/i })).toBeInTheDocument()
  })

  it('renders the From the Kitchen recipe rail once recipes load', async () => {
    renderHome()
    await waitFor(() => {
      expect(screen.getByText('Classic Margherita Pizza')).toBeInTheDocument()
    })
    expect(
      screen.getByRole('heading', { name: /lately i.ve been cooking/i })
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /browse all recipes/i })).toHaveAttribute(
      'href',
      '/recipes'
    )
  })

  it('does not render the kitchen section when there are no recipes', async () => {
    vi.mocked(fetchRecipes).mockResolvedValue([])
    renderHome()
    await waitFor(() => expect(fetchRecipes).toHaveBeenCalled())
    expect(screen.queryByText(/lately i.ve been cooking/i)).not.toBeInTheDocument()
  })

  it('does not render the kitchen section when the API fails', async () => {
    vi.mocked(fetchRecipes).mockRejectedValue(new Error('500'))
    renderHome()
    await waitFor(() => expect(fetchRecipes).toHaveBeenCalled())
    expect(screen.queryByText(/lately i.ve been cooking/i)).not.toBeInTheDocument()
  })

  it('renders content with no detectable axe violations', async () => {
    const { container } = renderHome()
    await waitFor(() => {
      expect(screen.getByText('Classic Margherita Pizza')).toBeInTheDocument()
    })

    expect(await axe(container)).toHaveNoViolations()
  })
})
