import type { RecipeIndex } from '@models/recipe'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import RecipeCard from './RecipeCard'

const mockRecipe: RecipeIndex = {
  id: 'rec-001',
  title: 'Classic Margherita Pizza',
  slug: 'classic-margherita-pizza',
  coverImage: {
    key: 'recipes/rec-001/cover',
    alt: 'Margherita pizza on a wooden board',
    processedAt: 1_700_000_000_000,
  },
  tags: ['Italian', 'Quick'],
  prepTime: 15,
  cookTime: 12,
  servings: 4,
  createdAt: '2026-03-20T10:00:00Z',
}

const renderRecipeCard = (recipe = mockRecipe) =>
  render(
    <MemoryRouter>
      <RecipeCard recipe={recipe} />
    </MemoryRouter>
  )

describe('RecipeCard', () => {
  it('renders cover image thumbnail with alt text', () => {
    renderRecipeCard()

    const img = screen.getByRole('img', { name: 'Margherita pizza on a wooden board' })
    expect(img).toBeInTheDocument()
  })

  it('renders recipe title as a link to /recipes/{slug}', () => {
    renderRecipeCard()

    const link = screen.getByRole('link', { name: /classic margherita pizza/i })
    expect(link).toHaveAttribute('href', '/recipes/classic-margherita-pizza')
  })

  it('renders tags', () => {
    renderRecipeCard()

    expect(screen.getByText('Italian')).toBeInTheDocument()
    expect(screen.getByText('Quick')).toBeInTheDocument()
  })

  it('renders prep time, cook time, and servings', () => {
    renderRecipeCard()

    expect(screen.getByText(/15/)).toBeInTheDocument()
    expect(screen.getByText(/12/)).toBeInTheDocument()
    expect(screen.getByText(/4/)).toBeInTheDocument()
  })

  it('renders a ProcessingPlaceholder in place of the thumbnail when coverImage.processedAt is absent', () => {
    const processingRecipe: RecipeIndex = {
      ...mockRecipe,
      coverImage: {
        key: 'recipes/rec-001/cover',
        alt: 'Margherita pizza on a wooden board',
      },
    }

    renderRecipeCard(processingRecipe)

    expect(screen.getByText(/processing image/i)).toBeInTheDocument()
    expect(
      screen.queryByRole('img', { name: 'Margherita pizza on a wooden board' })
    ).not.toBeInTheDocument()
  })
})
