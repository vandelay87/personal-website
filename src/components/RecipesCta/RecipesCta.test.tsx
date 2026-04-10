import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../api/recipes', () => ({
  fetchRecipes: vi.fn(),
}))

import { fetchRecipes } from '../../api/recipes'
import type { RecipeIndex } from '../../types/recipe'
import RecipesCta from './RecipesCta'

const mockRecipes: RecipeIndex[] = [
  {
    id: 'rec-001',
    title: 'Classic Margherita Pizza',
    slug: 'classic-margherita-pizza',
    coverImage: { key: 'recipes/rec-001/cover', alt: 'Margherita pizza' },
    tags: ['Italian', 'Quick'],
    prepTime: 15,
    cookTime: 12,
    servings: 4,
    createdAt: '2026-03-20T10:00:00Z',
  },
  {
    id: 'rec-002',
    title: 'Thai Green Curry',
    slug: 'thai-green-curry',
    coverImage: { key: 'recipes/rec-002/cover', alt: 'Thai green curry' },
    tags: ['Thai', 'Spicy'],
    prepTime: 20,
    cookTime: 25,
    servings: 2,
    createdAt: '2026-03-18T10:00:00Z',
  },
  {
    id: 'rec-003',
    title: 'Italian Pasta Carbonara',
    slug: 'italian-pasta-carbonara',
    coverImage: { key: 'recipes/rec-003/cover', alt: 'Pasta carbonara' },
    tags: ['Italian'],
    prepTime: 10,
    cookTime: 15,
    servings: 3,
    createdAt: '2026-03-15T10:00:00Z',
  },
]

const renderRecipesCta = () =>
  render(
    <MemoryRouter>
      <RecipesCta />
    </MemoryRouter>
  )

describe('RecipesCta', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(fetchRecipes).mockResolvedValue(mockRecipes)
  })

  it('renders up to 3 latest recipe cards with cover image, title, and tags', async () => {
    renderRecipesCta()

    await waitFor(() => {
      expect(screen.getByText('Classic Margherita Pizza')).toBeInTheDocument()
    })
    expect(screen.getByText('Thai Green Curry')).toBeInTheDocument()
    expect(screen.getByText('Italian Pasta Carbonara')).toBeInTheDocument()

    expect(screen.getByRole('img', { name: 'Margherita pizza' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Thai green curry' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Pasta carbonara' })).toBeInTheDocument()

    expect(screen.getByText('Italian')).toBeInTheDocument()
    expect(screen.getByText('Quick')).toBeInTheDocument()
    expect(screen.getByText('Thai')).toBeInTheDocument()
    expect(screen.getByText('Spicy')).toBeInTheDocument()
  })

  it('shows available cards when fewer than 3 recipes exist', async () => {
    vi.mocked(fetchRecipes).mockResolvedValue(mockRecipes.slice(0, 2))

    renderRecipesCta()

    await waitFor(() => {
      expect(screen.getByText('Classic Margherita Pizza')).toBeInTheDocument()
    })
    expect(screen.getByText('Thai Green Curry')).toBeInTheDocument()
    expect(screen.getAllByRole('img')).toHaveLength(2)
  })

  it('does not render the section when no published recipes exist', async () => {
    vi.mocked(fetchRecipes).mockResolvedValue([])

    const { container } = renderRecipesCta()

    await waitFor(() => {
      expect(fetchRecipes).toHaveBeenCalled()
    })

    expect(container.querySelector('section')).not.toBeInTheDocument()
    expect(screen.queryByText(/from the kitchen/i)).not.toBeInTheDocument()
  })

  it('does not render the section when the API fails', async () => {
    vi.mocked(fetchRecipes).mockRejectedValue(new Error('500 Internal Server Error'))

    const { container } = renderRecipesCta()

    await waitFor(() => {
      expect(fetchRecipes).toHaveBeenCalled()
    })

    expect(container.querySelector('section')).not.toBeInTheDocument()
    expect(screen.queryByText(/from the kitchen/i)).not.toBeInTheDocument()
  })

  it('shows skeleton placeholders while loading', () => {
    vi.mocked(fetchRecipes).mockReturnValue(new Promise(() => {}))

    renderRecipesCta()

    const skeletons = screen.getAllByRole('status', { name: /loading/i })
    expect(skeletons.length).toBeGreaterThanOrEqual(1)
  })

  it('includes a heading and link to /recipes', async () => {
    renderRecipesCta()

    await waitFor(() => {
      expect(screen.getByText('Classic Margherita Pizza')).toBeInTheDocument()
    })

    expect(screen.getByRole('heading', { name: /from the kitchen/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /recipes/i })).toHaveAttribute('href', '/recipes')
  })
})
