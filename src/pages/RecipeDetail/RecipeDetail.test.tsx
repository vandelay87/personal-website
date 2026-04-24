import { fetchRecipe } from '@api/recipes'
import { RecipeDataContext } from '@contexts/RecipeDataContext'
import type { Recipe } from '@models/recipe'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import RecipeDetail from './RecipeDetail'

vi.mock('@api/recipes', () => ({
  fetchRecipe: vi.fn(),
}))

const mockRecipe: Recipe = {
  id: 'recipe-1',
  title: 'Test Recipe',
  slug: 'test-recipe',
  intro: 'A delicious test recipe',
  coverImage: {
    key: 'processed/recipes/recipe-1/cover',
    alt: 'Test cover',
    processedAt: 1_700_000_000_000,
  },
  ingredients: [
    { item: 'flour', quantity: '200', unit: 'g' },
    { item: 'sugar', quantity: '100', unit: 'g' },
  ],
  steps: [
    {
      order: 1,
      text: 'Mix ingredients',
      image: {
        key: 'processed/recipes/recipe-1/step-1',
        alt: 'Mixing',
        processedAt: 1_700_000_000_000,
      },
    },
    { order: 2, text: 'Bake for 30 minutes' },
  ],
  tags: ['Baking', 'Dessert'],
  prepTime: 15,
  cookTime: 30,
  servings: 4,
  authorId: 'user-1',
  authorName: 'Akli',
  createdAt: '2026-04-10T12:00:00Z',
  updatedAt: '2026-04-10T12:00:00Z',
  status: 'published',
}

const renderRecipeDetail = (recipe?: Recipe) =>
  render(
    <RecipeDataContext.Provider value={{ recipe }}>
      <MemoryRouter initialEntries={['/recipes/test-recipe']}>
        <Routes>
          <Route path="/recipes/:slug" element={<RecipeDetail />} />
        </Routes>
      </MemoryRouter>
    </RecipeDataContext.Provider>
  )

describe('RecipeDetail page', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('renders full recipe content when SSR data is in context', () => {
    renderRecipeDetail(mockRecipe)

    // Cover image
    const coverImg = screen.getByRole('img', { name: 'Test cover' })
    expect(coverImg).toBeInTheDocument()

    // Title
    expect(
      screen.getByRole('heading', { level: 1, name: 'Test Recipe' })
    ).toBeInTheDocument()

    // Date and metadata
    expect(screen.getByText(/10 April 2026/i)).toBeInTheDocument()

    // Ingredients
    expect(screen.getByText(/flour/)).toBeInTheDocument()
    expect(screen.getByText(/sugar/)).toBeInTheDocument()

    // Steps
    expect(screen.getByText('Mix ingredients')).toBeInTheDocument()
    expect(screen.getByText('Bake for 30 minutes')).toBeInTheDocument()

    // Tags
    expect(screen.getByText('Baking')).toBeInTheDocument()
    expect(screen.getByText('Dessert')).toBeInTheDocument()
  })

  it('renders cover image with srcSet containing medium and full variants', () => {
    renderRecipeDetail(mockRecipe)

    const coverImg = screen.getByRole('img', { name: 'Test cover' })
    const srcSet = coverImg.getAttribute('srcSet') ?? coverImg.getAttribute('srcset')
    expect(srcSet).toContain('medium')
    expect(srcSet).toContain('full')
    expect(coverImg).toHaveAttribute('loading', 'eager')
  })

  it('renders tags as links to /recipes?tag=X', () => {
    renderRecipeDetail(mockRecipe)

    const bakingLink = screen.getByRole('link', { name: 'Baking' })
    expect(bakingLink).toHaveAttribute('href', '/recipes?tag=Baking')

    const dessertLink = screen.getByRole('link', { name: 'Dessert' })
    expect(dessertLink).toHaveAttribute('href', '/recipes?tag=Dessert')
  })

  it('fetches from API on client-side navigation when context is empty', async () => {
    vi.mocked(fetchRecipe).mockResolvedValue(mockRecipe)

    renderRecipeDetail(undefined)

    await waitFor(() => {
      expect(fetchRecipe).toHaveBeenCalledWith('test-recipe')
    })

    await waitFor(() => {
      expect(screen.getByText('Test Recipe')).toBeInTheDocument()
    })
  })

  it('shows 404 for non-existent slug', async () => {
    vi.mocked(fetchRecipe).mockRejectedValue(new Error('404 Not Found'))

    renderRecipeDetail(undefined)

    await waitFor(() => {
      expect(screen.getByText(/not found/i)).toBeInTheDocument()
    })
  })

  it('shows error state with retry button on API failure', async () => {
    vi.mocked(fetchRecipe).mockRejectedValue(
      new Error('500 Internal Server Error')
    )

    renderRecipeDetail(undefined)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })
  })

  it('uses SSR data from context without calling fetchRecipe', () => {
    renderRecipeDetail(mockRecipe)

    expect(screen.getByText('Test Recipe')).toBeInTheDocument()
    expect(fetchRecipe).not.toHaveBeenCalled()
  })
})
