import type { Ingredient } from '@models/recipe'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
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

    expect(screen.getByText('flour')).toBeInTheDocument()
    expect(screen.getByText('200 g')).toBeInTheDocument()
    expect(screen.getByText('sugar')).toBeInTheDocument()
    expect(screen.getByText('100 g')).toBeInTheDocument()
    expect(screen.getByText('butter')).toBeInTheDocument()
    expect(screen.getByText('50 g')).toBeInTheDocument()
  })
})

// Checked state is persisted to localStorage under the key
// `recipe-ingredients:${slug}`, whose value is `{ checked: string[], expiresAt: number }`.
// Each ingredient key matches the list's existing React key scheme
// (`${item}-${idx}`) so the same identifier can be reused for both the DOM
// key and the persistence key. `expiresAt` (now + 7 days, recomputed on
// every write) treats the checklist as a single cooking session rather
// than a durable preference — a stale entry reads back as unchecked.
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

    expect(screen.getByRole('checkbox', { name: 'flour 200 g' })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'sugar 100 g' })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'butter 50 g' })).toBeInTheDocument()
  })

  it('starts unchecked and toggles checked state on click', () => {
    render(<RecipeIngredients ingredients={mockIngredients} slug="spaghetti-bolognese" />)

    const flourCheckbox = screen.getByRole('checkbox', { name: 'flour 200 g' })
    expect(flourCheckbox).not.toBeChecked()

    fireEvent.click(flourCheckbox)
    expect(flourCheckbox).toBeChecked()

    fireEvent.click(flourCheckbox)
    expect(flourCheckbox).not.toBeChecked()
  })

  it('toggling one ingredient does not affect the checked state of the others', () => {
    render(<RecipeIngredients ingredients={mockIngredients} slug="spaghetti-bolognese" />)

    fireEvent.click(screen.getByRole('checkbox', { name: 'flour 200 g' }))

    expect(screen.getByRole('checkbox', { name: 'flour 200 g' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'sugar 100 g' })).not.toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'butter 50 g' })).not.toBeChecked()
  })

  it('persists checked state to localStorage keyed by the recipe slug', () => {
    render(<RecipeIngredients ingredients={mockIngredients} slug="spaghetti-bolognese" />)

    fireEvent.click(screen.getByRole('checkbox', { name: 'flour 200 g' }))

    const stored = localStorage.getItem('recipe-ingredients:spaghetti-bolognese')
    expect(stored).not.toBeNull()
    const parsed = JSON.parse(stored as string)
    expect(parsed.checked).toContain('flour-0')
    expect(parsed.expiresAt).toBeGreaterThan(Date.now())
  })

  it('restores checked state from localStorage when remounted with the same slug', () => {
    const { unmount } = render(
      <RecipeIngredients ingredients={mockIngredients} slug="spaghetti-bolognese" />
    )

    fireEvent.click(screen.getByRole('checkbox', { name: 'flour 200 g' }))
    unmount()

    render(<RecipeIngredients ingredients={mockIngredients} slug="spaghetti-bolognese" />)

    expect(screen.getByRole('checkbox', { name: 'flour 200 g' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'sugar 100 g' })).not.toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'butter 50 g' })).not.toBeChecked()
  })

  it('does not bleed checked state between different recipes', () => {
    const { unmount } = render(
      <RecipeIngredients ingredients={mockIngredients} slug="spaghetti-bolognese" />
    )

    fireEvent.click(screen.getByRole('checkbox', { name: 'flour 200 g' }))
    unmount()

    render(<RecipeIngredients ingredients={mockIngredients} slug="thai-green-curry" />)

    expect(screen.getByRole('checkbox', { name: 'flour 200 g' })).not.toBeChecked()
    expect(
      localStorage.getItem('recipe-ingredients:thai-green-curry')
    ).toBeNull()
  })

  it.each<[string, number, boolean]>([
    ['treats checked state older than 7 days as expired', 7 * 24 * 60 * 60 * 1000 + 1, false],
    ['keeps checked state that has not yet expired', 7 * 24 * 60 * 60 * 1000 - 1, true],
  ])('%s', (_label, elapsedMs, expectStillChecked) => {
    // The clock is faked before the initial click (rather than started
    // afterwards) so the write's `Date.now()` and the later expiry check
    // both read from the same deterministic fake clock — pinning the
    // clock only after the click left a real-time gap between the two
    // reads, which could tip the "not yet expired" case over the edge on
    // a slow/contended test runner.
    vi.useFakeTimers()

    const { unmount } = render(
      <RecipeIngredients ingredients={mockIngredients} slug="spaghetti-bolognese" />
    )

    fireEvent.click(screen.getByRole('checkbox', { name: 'flour 200 g' }))
    unmount()

    vi.advanceTimersByTime(elapsedMs)

    render(<RecipeIngredients ingredients={mockIngredients} slug="spaghetti-bolognese" />)

    if (expectStillChecked) {
      expect(screen.getByRole('checkbox', { name: 'flour 200 g' })).toBeChecked()
    } else {
      expect(screen.getByRole('checkbox', { name: 'flour 200 g' })).not.toBeChecked()
    }

    vi.useRealTimers()
  })

  it('does not bleed checked state when the slug prop changes on the same instance (client-side navigation, no unmount)', () => {
    const { rerender } = render(
      <RecipeIngredients ingredients={mockIngredients} slug="spaghetti-bolognese" />
    )

    fireEvent.click(screen.getByRole('checkbox', { name: 'flour 200 g' }))
    expect(screen.getByRole('checkbox', { name: 'flour 200 g' })).toBeChecked()

    // Same component instance, no unmount — mirrors React Router reusing
    // the <RecipeDetail> route element when navigating between recipes.
    rerender(<RecipeIngredients ingredients={mockIngredients} slug="thai-green-curry" />)

    expect(screen.getByRole('checkbox', { name: 'flour 200 g' })).not.toBeChecked()
    expect(
      localStorage.getItem('recipe-ingredients:thai-green-curry')
    ).toBeNull()
  })
})
