import type { Tag } from '@models/recipe'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import RecipeTagFilter from './RecipeTagFilter'

const mockTags: Tag[] = [
  { tag: 'Italian', count: 5 },
  { tag: 'Quick', count: 3 },
  { tag: 'Vegetarian', count: 8 },
]

describe('RecipeTagFilter', () => {
  it('renders tag buttons with counts', () => {
    render(
      <RecipeTagFilter tags={mockTags} activeTag={null} onTagClick={vi.fn()} />
    )

    expect(screen.getByRole('button', { name: /Italian/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Quick/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Vegetarian/i })).toBeInTheDocument()

    expect(screen.getByText(/5/)).toBeInTheDocument()
    expect(screen.getByText(/3/)).toBeInTheDocument()
    expect(screen.getByText(/8/)).toBeInTheDocument()
  })

  it('active tag has aria-pressed="true"', () => {
    render(
      <RecipeTagFilter tags={mockTags} activeTag="Italian" onTagClick={vi.fn()} />
    )

    expect(screen.getByRole('button', { name: /Italian/i })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
  })

  it('inactive tag has aria-pressed="false"', () => {
    render(
      <RecipeTagFilter tags={mockTags} activeTag="Italian" onTagClick={vi.fn()} />
    )

    expect(screen.getByRole('button', { name: /Quick/i })).toHaveAttribute(
      'aria-pressed',
      'false'
    )
    expect(screen.getByRole('button', { name: /Vegetarian/i })).toHaveAttribute(
      'aria-pressed',
      'false'
    )
  })
})
