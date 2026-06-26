import type { Step } from '@models/recipe'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import RecipeSteps from './RecipeSteps'

const slug = 'spaghetti-bolognese'
const stepId1 = '9d904a59-e83f-43b8-9f40-fbdb3008974c'
const stepId3 = '1b2c3d4e-5f60-4a1b-8c2d-3e4f5a6b7c8d'

const mockSteps: Step[] = [
  {
    stepId: stepId1,
    order: 1,
    text: 'Mix ingredients together',
    image: {
      alt: 'Mixing bowl',
      processedAt: 1_700_000_000_000,
    },
  },
  { stepId: '2a3b4c5d-6e7f-4081-9a2b-3c4d5e6f7081', order: 2, text: 'Bake for 30 minutes' },
  {
    stepId: stepId3,
    order: 3,
    text: 'Let it cool',
    image: {
      alt: 'Cooling rack',
      processedAt: 1_700_000_000_000,
    },
  },
]

describe('RecipeSteps', () => {
  it('renders an ordered list with step items', () => {
    render(<RecipeSteps steps={mockSteps} slug={slug} />)

    const list = screen.getByRole('list')
    expect(list.tagName).toBe('OL')

    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(3)
  })

  it('shows step text', () => {
    render(<RecipeSteps steps={mockSteps} slug={slug} />)

    expect(screen.getByText('Mix ingredients together')).toBeInTheDocument()
    expect(screen.getByText('Bake for 30 minutes')).toBeInTheDocument()
    expect(screen.getByText('Let it cool')).toBeInTheDocument()
  })

  it('shows step image with alt text when image is present', () => {
    render(<RecipeSteps steps={mockSteps} slug={slug} />)

    const mixingImg = screen.getByRole('img', { name: 'Mixing bowl' })
    expect(mixingImg).toBeInTheDocument()
    expect(mixingImg).toHaveAttribute('loading', 'lazy')
    expect(mixingImg).toHaveAttribute(
      'src',
      expect.stringContaining(`recipes/${slug}/step-${stepId1}-medium`)
    )

    const coolingImg = screen.getByRole('img', { name: 'Cooling rack' })
    expect(coolingImg).toBeInTheDocument()
    expect(coolingImg).toHaveAttribute(
      'src',
      expect.stringContaining(`recipes/${slug}/step-${stepId3}-medium`)
    )
  })

  it('does not show image when step has no image', () => {
    render(
      <RecipeSteps
        steps={[{ stepId: stepId1, order: 1, text: 'Bake for 30 minutes' }]}
        slug={slug}
      />
    )

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('renders a ProcessingPlaceholder in place of the image when step.image.processedAt is absent', () => {
    const processingSteps: Step[] = [
      {
        stepId: stepId1,
        order: 1,
        text: 'Mix ingredients together',
        image: {
          alt: 'Mixing bowl',
        },
      },
    ]

    render(<RecipeSteps steps={processingSteps} slug={slug} />)

    expect(screen.getByText(/processing image/i)).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('renders the ready image and no placeholder when only some step images are processed', () => {
    const mixedSteps: Step[] = [
      {
        stepId: stepId1,
        order: 1,
        text: 'Mix ingredients together',
        image: {
          alt: 'Mixing bowl',
          processedAt: 1_700_000_000_000,
        },
      },
      {
        stepId: stepId3,
        order: 2,
        text: 'Let it cool',
        image: {
          alt: 'Cooling rack',
        },
      },
    ]

    render(<RecipeSteps steps={mixedSteps} slug={slug} />)

    expect(screen.getByRole('img', { name: 'Mixing bowl' })).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: 'Cooling rack' })).not.toBeInTheDocument()
    expect(screen.getByText(/processing image/i)).toBeInTheDocument()
  })
})
