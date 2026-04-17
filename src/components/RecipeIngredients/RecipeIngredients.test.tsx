import type { Ingredient } from '@models/recipe'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import RecipeIngredients from './RecipeIngredients'

const mockIngredients: Ingredient[] = [
  { item: 'flour', quantity: '200', unit: 'g' },
  { item: 'sugar', quantity: '100', unit: 'g' },
  { item: 'butter', quantity: '50', unit: 'g' },
]

describe('RecipeIngredients', () => {
  it('renders a list with ingredient items', () => {
    render(<RecipeIngredients ingredients={mockIngredients} />)

    const list = screen.getByRole('list')
    expect(list).toBeInTheDocument()

    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(3)
  })

  it('shows quantity, unit, and item name for each ingredient', () => {
    render(<RecipeIngredients ingredients={mockIngredients} />)

    expect(screen.getByText('200 g flour')).toBeInTheDocument()
    expect(screen.getByText('100 g sugar')).toBeInTheDocument()
    expect(screen.getByText('50 g butter')).toBeInTheDocument()
  })
})
