import type { Step } from '@models/recipe'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import RecipeSteps from './RecipeSteps'

const mockSteps: Step[] = [
  {
    order: 1,
    text: 'Mix ingredients together',
    image: { key: 'processed/recipes/recipe-1/step-1', alt: 'Mixing bowl' },
  },
  { order: 2, text: 'Bake for 30 minutes' },
  {
    order: 3,
    text: 'Let it cool',
    image: { key: 'processed/recipes/recipe-1/step-3', alt: 'Cooling rack' },
  },
]

describe('RecipeSteps', () => {
  it('renders an ordered list with step items', () => {
    render(<RecipeSteps steps={mockSteps} />)

    const list = screen.getByRole('list')
    expect(list.tagName).toBe('OL')

    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(3)
  })

  it('shows step text', () => {
    render(<RecipeSteps steps={mockSteps} />)

    expect(screen.getByText('Mix ingredients together')).toBeInTheDocument()
    expect(screen.getByText('Bake for 30 minutes')).toBeInTheDocument()
    expect(screen.getByText('Let it cool')).toBeInTheDocument()
  })

  it('shows step image with alt text when image is present', () => {
    render(<RecipeSteps steps={mockSteps} />)

    const mixingImg = screen.getByRole('img', { name: 'Mixing bowl' })
    expect(mixingImg).toBeInTheDocument()
    expect(mixingImg).toHaveAttribute('loading', 'lazy')
    expect(mixingImg).toHaveAttribute(
      'src',
      expect.stringContaining('processed/recipes/recipe-1/step-1-medium')
    )

    const coolingImg = screen.getByRole('img', { name: 'Cooling rack' })
    expect(coolingImg).toBeInTheDocument()
  })

  it('does not show image when step has no image', () => {
    render(<RecipeSteps steps={[{ order: 1, text: 'Bake for 30 minutes' }]} />)

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})
