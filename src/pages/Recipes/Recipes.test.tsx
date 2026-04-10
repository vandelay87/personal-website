import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
vi.mock('../../api/recipes', () => ({
  fetchRecipes: vi.fn(),
  fetchTags: vi.fn(),
}))

import { fetchRecipes, fetchTags } from '../../api/recipes'
import type { RecipeIndex, Tag } from '../../types/recipe'
import Recipes from './Recipes'

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

const mockTags: Tag[] = [
  { tag: 'Italian', count: 2 },
  { tag: 'Quick', count: 1 },
  { tag: 'Thai', count: 1 },
  { tag: 'Spicy', count: 1 },
]

const renderRecipes = (initialRoute = '/recipes') =>
  render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Recipes />
    </MemoryRouter>
  )

describe('Recipes page', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(fetchRecipes).mockResolvedValue(mockRecipes)
    vi.mocked(fetchTags).mockResolvedValue(mockTags)
  })

  it('renders recipe grid after loading', async () => {
    renderRecipes()

    await waitFor(() => {
      expect(screen.getByText('Classic Margherita Pizza')).toBeInTheDocument()
    })
    expect(screen.getByText('Thai Green Curry')).toBeInTheDocument()
    expect(screen.getByText('Italian Pasta Carbonara')).toBeInTheDocument()
  })

  it('shows skeleton placeholders while loading', async () => {
    vi.mocked(fetchRecipes).mockReturnValue(new Promise(() => {}))
    vi.mocked(fetchTags).mockReturnValue(new Promise(() => {}))

    renderRecipes()

    await waitFor(() => {
      const skeletons = screen.getAllByRole('status', { name: /loading/i })
      expect(skeletons.length).toBeGreaterThanOrEqual(1)
    })
  })

  it('filters by tag via URL search param (?tag=Italian)', async () => {
    renderRecipes('/recipes?tag=Italian')

    await waitFor(() => {
      expect(screen.getByText('Classic Margherita Pizza')).toBeInTheDocument()
    })
    expect(screen.getByText('Italian Pasta Carbonara')).toBeInTheDocument()
    expect(screen.queryByText('Thai Green Curry')).not.toBeInTheDocument()
  })

  it('searches by keyword (title match)', async () => {
    renderRecipes()

    await waitFor(() => {
      expect(screen.getByText('Classic Margherita Pizza')).toBeInTheDocument()
    })

    const searchInput = screen.getByRole('searchbox', { name: /search recipes/i })
    fireEvent.change(searchInput, { target: { value: 'curry' } })

    await waitFor(() => {
      expect(screen.getByText('Thai Green Curry')).toBeInTheDocument()
      expect(screen.queryByText('Classic Margherita Pizza')).not.toBeInTheDocument()
    })
  })

  it('applies combined tag + search filtering', async () => {
    renderRecipes('/recipes?tag=Italian')

    await waitFor(() => {
      expect(screen.getByText('Classic Margherita Pizza')).toBeInTheDocument()
    })

    const searchInput = screen.getByRole('searchbox', { name: /search recipes/i })
    fireEvent.change(searchInput, { target: { value: 'carbonara' } })

    await waitFor(() => {
      expect(screen.getByText('Italian Pasta Carbonara')).toBeInTheDocument()
      expect(screen.queryByText('Classic Margherita Pizza')).not.toBeInTheDocument()
    })
  })

  it('shows "No recipes found" with clear button when filter has no matches', async () => {
    renderRecipes()

    await waitFor(() => {
      expect(screen.getByText('Classic Margherita Pizza')).toBeInTheDocument()
    })

    const searchInput = screen.getByRole('searchbox', { name: /search recipes/i })
    fireEvent.change(searchInput, { target: { value: 'nonexistent dish xyz' } })

    await waitFor(() => {
      expect(screen.getByText(/no recipes found/i)).toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument()
  })

  it('shows "Recipes coming soon" when no recipes exist', async () => {
    vi.mocked(fetchRecipes).mockResolvedValue([])
    vi.mocked(fetchTags).mockResolvedValue([])

    renderRecipes()

    await waitFor(() => {
      expect(screen.getByText(/recipes coming soon/i)).toBeInTheDocument()
    })
  })

  it('shows error state with retry button when API fails', async () => {
    vi.mocked(fetchRecipes).mockRejectedValue(new Error('500 Internal Server Error'))
    vi.mocked(fetchTags).mockRejectedValue(new Error('500 Internal Server Error'))

    renderRecipes()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })
  })

  it('has aria-live region for recipe count', async () => {
    renderRecipes()

    await waitFor(() => {
      expect(screen.getByText('Classic Margherita Pizza')).toBeInTheDocument()
    })

    const liveRegion = screen.getByRole('status')
    expect(liveRegion).toHaveAttribute('aria-live', 'polite')
  })
})
