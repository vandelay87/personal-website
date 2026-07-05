import type { Ingredient } from '@models/recipe'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
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

// Checked state is persisted to localStorage under the key
// `recipe-ingredients:${slug}`, whose value is a JSON array of checked
// ingredient keys. Each ingredient key matches the list's existing React key
// scheme (`${item}-${idx}`) so the same identifier can be reused for both
// the DOM key and the persistence key.
describe('RecipeIngredients checkboxes', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    cleanup()
    localStorage.clear()
  })

  it('renders each ingredient as a checkbox with an accessible name derived from its text', () => {
    render(<RecipeIngredients ingredients={mockIngredients} slug="spaghetti-bolognese" />)

    expect(screen.getByRole('checkbox', { name: '200 g flour' })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: '100 g sugar' })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: '50 g butter' })).toBeInTheDocument()
  })

  it('starts unchecked and toggles checked state on click', () => {
    render(<RecipeIngredients ingredients={mockIngredients} slug="spaghetti-bolognese" />)

    const flourCheckbox = screen.getByRole('checkbox', { name: '200 g flour' })
    expect(flourCheckbox).not.toBeChecked()

    fireEvent.click(flourCheckbox)
    expect(flourCheckbox).toBeChecked()

    fireEvent.click(flourCheckbox)
    expect(flourCheckbox).not.toBeChecked()
  })

  it('persists checked state to localStorage keyed by the recipe slug', () => {
    render(<RecipeIngredients ingredients={mockIngredients} slug="spaghetti-bolognese" />)

    fireEvent.click(screen.getByRole('checkbox', { name: '200 g flour' }))

    const stored = localStorage.getItem('recipe-ingredients:spaghetti-bolognese')
    expect(stored).not.toBeNull()
    expect(JSON.parse(stored as string)).toContain('flour-0')
  })

  it('restores checked state from localStorage when remounted with the same slug', () => {
    const { unmount } = render(
      <RecipeIngredients ingredients={mockIngredients} slug="spaghetti-bolognese" />
    )

    fireEvent.click(screen.getByRole('checkbox', { name: '200 g flour' }))
    unmount()

    render(<RecipeIngredients ingredients={mockIngredients} slug="spaghetti-bolognese" />)

    expect(screen.getByRole('checkbox', { name: '200 g flour' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: '100 g sugar' })).not.toBeChecked()
    expect(screen.getByRole('checkbox', { name: '50 g butter' })).not.toBeChecked()
  })

  it('does not bleed checked state between different recipes', () => {
    const { unmount } = render(
      <RecipeIngredients ingredients={mockIngredients} slug="spaghetti-bolognese" />
    )

    fireEvent.click(screen.getByRole('checkbox', { name: '200 g flour' }))
    unmount()

    render(<RecipeIngredients ingredients={mockIngredients} slug="thai-green-curry" />)

    expect(screen.getByRole('checkbox', { name: '200 g flour' })).not.toBeChecked()
    expect(
      localStorage.getItem('recipe-ingredients:thai-green-curry')
    ).toBeNull()
  })
})
