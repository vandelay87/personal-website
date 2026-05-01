import type { Recipe } from '@models/recipe'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import RecipeDetailView from './RecipeDetailView'

const baseRecipe: Recipe = {
  id: 'recipe-1',
  title: 'Test Recipe',
  slug: 'test-recipe',
  intro: 'A delicious test recipe',
  coverImage: {
    key: 'processed/recipes/recipe-1/cover',
    alt: 'Test cover',
    processedAt: 1_700_000_000_000,
  },
  ingredients: [{ item: 'flour', quantity: '200', unit: 'g' }],
  steps: [{ order: 1, text: 'Mix ingredients' }],
  tags: ['Baking'],
  prepTime: 15,
  cookTime: 30,
  servings: 4,
  authorId: 'user-1',
  authorName: 'Akli',
  createdAt: '2026-04-10T12:00:00Z',
  updatedAt: '2026-04-10T12:00:00Z',
  status: 'published',
}

const renderView = (recipe: Recipe) =>
  render(
    <MemoryRouter>
      <RecipeDetailView recipe={recipe} />
    </MemoryRouter>
  )

describe('RecipeDetailView', () => {
  it('renders the cover image when coverImage.processedAt is set', () => {
    renderView(baseRecipe)

    const coverImg = screen.getByRole('img', { name: 'Test cover' })
    expect(coverImg).toBeInTheDocument()
    expect(coverImg).toHaveAttribute(
      'src',
      expect.stringContaining('processed/recipes/recipe-1/cover-medium')
    )
    expect(screen.queryByText(/processing image/i)).not.toBeInTheDocument()
  })

  it('renders the ProcessingPlaceholder when coverImage.processedAt is absent', () => {
    const processingRecipe: Recipe = {
      ...baseRecipe,
      coverImage: {
        key: 'processed/recipes/recipe-1/cover',
        alt: 'Test cover',
      },
    }

    renderView(processingRecipe)

    expect(screen.getByText(/processing image/i)).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: 'Test cover' })).not.toBeInTheDocument()
  })
})
