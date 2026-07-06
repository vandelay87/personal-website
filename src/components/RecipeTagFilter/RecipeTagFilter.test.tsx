import type { Tag } from '@models/recipe'
import { render, screen, fireEvent } from '@testing-library/react'
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
      <RecipeTagFilter tags={mockTags} activeTag={null} onTagClick={vi.fn()} onClear={vi.fn()} />
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
      <RecipeTagFilter tags={mockTags} activeTag="Italian" onTagClick={vi.fn()} onClear={vi.fn()} />
    )

    expect(screen.getByRole('button', { name: /Italian/i })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
  })

  it('inactive tag has aria-pressed="false"', () => {
    render(
      <RecipeTagFilter tags={mockTags} activeTag="Italian" onTagClick={vi.fn()} onClear={vi.fn()} />
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

  it('exposes the tag chips as an accessible group with a descriptive label', () => {
    render(
      <RecipeTagFilter tags={mockTags} activeTag={null} onTagClick={vi.fn()} onClear={vi.fn()} />
    )

    const group = screen.getByRole('group', { name: /filter by tag/i })
    expect(group).toBeInTheDocument()
    expect(group).toContainElement(screen.getByRole('button', { name: /Italian/i }))
  })

  describe('All chip', () => {
    it('renders an "All" chip pressed when no tag is active', () => {
      render(
        <RecipeTagFilter tags={mockTags} activeTag={null} onTagClick={vi.fn()} onClear={vi.fn()} />
      )

      expect(screen.getByRole('button', { name: /^all$/i })).toHaveAttribute(
        'aria-pressed',
        'true'
      )
    })

    it('is not pressed once a tag is active', () => {
      render(
        <RecipeTagFilter
          tags={mockTags}
          activeTag="Italian"
          onTagClick={vi.fn()}
          onClear={vi.fn()}
        />
      )

      expect(screen.getByRole('button', { name: /^all$/i })).toHaveAttribute(
        'aria-pressed',
        'false'
      )
    })

    it('calls onClear when clicked', () => {
      const onClear = vi.fn()
      render(
        <RecipeTagFilter
          tags={mockTags}
          activeTag="Italian"
          onTagClick={vi.fn()}
          onClear={onClear}
        />
      )

      fireEvent.click(screen.getByRole('button', { name: /^all$/i }))

      expect(onClear).toHaveBeenCalledOnce()
    })
  })
})
