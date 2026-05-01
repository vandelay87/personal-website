import type { Step } from '@models/recipe'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import StepList from './StepList'
import styles from './StepList.module.css'

const makeStep = (order: number, text: string): Step => ({ order, text })

const mockGetToken = vi.fn().mockResolvedValue('token-123')

describe('StepList', () => {
  const twoSteps: Step[] = [makeStep(1, 'Preheat oven'), makeStep(2, 'Mix ingredients')]

  it('renders step rows with text textarea', () => {
    const onChange = vi.fn()
    render(<StepList steps={twoSteps} onChange={onChange} getToken={mockGetToken} recipeId="test-recipe-id" />)

    const textareas = screen.getAllByRole('textbox', { name: /^step \d+ text$/i })
    expect(textareas).toHaveLength(2)
    expect(textareas[0]).toHaveValue('Preheat oven')
    expect(textareas[1]).toHaveValue('Mix ingredients')
  })

  it('step numbers auto-update', () => {
    const onChange = vi.fn()
    render(<StepList steps={twoSteps} onChange={onChange} getToken={mockGetToken} recipeId="test-recipe-id" />)

    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('"Add step" button adds new row', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<StepList steps={twoSteps} onChange={onChange} getToken={mockGetToken} recipeId="test-recipe-id" />)

    const addButton = screen.getByRole('button', { name: /add step/i })
    await user.click(addButton)

    expect(onChange).toHaveBeenCalledWith([
      ...twoSteps,
      { order: 3, text: '' },
    ])
  })

  it('remove button removes a row (minimum 1 enforced)', () => {
    const onChange = vi.fn()
    render(
      <StepList steps={[makeStep(1, 'Only step')]} onChange={onChange} getToken={mockGetToken} recipeId="test-recipe-id" />
    )

    const removeButton = screen.getByRole('button', { name: /remove/i })
    expect(removeButton).toBeDisabled()
  })

  it('move up/down reorder and renumber steps', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<StepList steps={twoSteps} onChange={onChange} getToken={mockGetToken} recipeId="test-recipe-id" />)

    const moveDownButtons = screen.getAllByRole('button', { name: /move down/i })
    await user.click(moveDownButtons[0])

    expect(onChange).toHaveBeenCalledWith([
      { order: 1, text: 'Mix ingredients' },
      { order: 2, text: 'Preheat oven' },
    ])
  })

  it('after reordering two steps, the rendered step-number labels reflect the new order', async () => {
    const user = userEvent.setup()
    const Wrapper = () => {
      const [steps, setSteps] = useState<Step[]>(twoSteps)
      return <StepList steps={steps} onChange={setSteps} getToken={mockGetToken} recipeId="test-recipe-id" />
    }
    render(<Wrapper />)

    const moveDownButtons = screen.getAllByRole('button', { name: /move down/i })
    await user.click(moveDownButtons[0])

    expect(screen.getByLabelText('Step 1 text')).toHaveValue('Mix ingredients')
    expect(screen.getByLabelText('Step 2 text')).toHaveValue('Preheat oven')
  })

  describe('per-step image upload (when getToken is provided)', () => {
    it('renders an image upload control and an alt-text input per step', () => {
      const onChange = vi.fn()
      render(<StepList steps={twoSteps} onChange={onChange} getToken={mockGetToken} recipeId="test-recipe-id" />)

      const uploadButtons = screen.getAllByRole('button', { name: /^upload$/i })
      expect(uploadButtons).toHaveLength(2)

      expect(screen.getByLabelText('Step 1 image alt text')).toBeInTheDocument()
      expect(screen.getByLabelText('Step 2 image alt text')).toBeInTheDocument()
    })

    it('does not render the image upload control when getToken is not provided', () => {
      const onChange = vi.fn()
      render(<StepList steps={twoSteps} onChange={onChange} recipeId="test-recipe-id" />)

      expect(screen.queryByRole('button', { name: /^upload$/i })).not.toBeInTheDocument()
      expect(screen.queryByLabelText('Step 1 image alt text')).not.toBeInTheDocument()
    })

    it('passes processedAt through to per-step ImageUpload so the correct render branch shows', () => {
      const onChange = vi.fn()
      const unreadyStep: Step = {
        order: 1,
        text: 'Stir',
        image: { key: 'img/step.jpg', alt: 'x' },
      }
      const { rerender } = render(
        <StepList
          steps={[unreadyStep]}
          onChange={onChange}
          getToken={mockGetToken}
          recipeId="test-recipe-id"
        />
      )

      expect(screen.getByText(/processing image/i)).toBeInTheDocument()
      expect(screen.queryByRole('img')).not.toBeInTheDocument()

      const readyStep: Step = {
        order: 1,
        text: 'Stir',
        image: { key: 'img/step.jpg', alt: 'x', processedAt: 12345 },
      }
      rerender(
        <StepList
          steps={[readyStep]}
          onChange={onChange}
          getToken={mockGetToken}
          recipeId="test-recipe-id"
        />
      )

      expect(screen.getByRole('img')).toBeInTheDocument()
      expect(screen.queryByText(/processing image/i)).not.toBeInTheDocument()
    })

    it('typing in the alt-text input calls onChange with the updated step', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(
        <StepList
          steps={[makeStep(1, 'Preheat oven')]}
          onChange={onChange}
          getToken={mockGetToken}
          recipeId="test-recipe-id"
        />
      )

      const altInput = screen.getByLabelText('Step 1 image alt text')
      await user.type(altInput, 'A')

      expect(onChange).toHaveBeenCalledWith([
        { order: 1, text: 'Preheat oven', image: { key: '', alt: 'A' } },
      ])
    })
  })

  describe('accessibility — touch targets', () => {
    // Note: jsdom does not apply CSS Modules styles to computed style, so we
    // assert the button carries the action-button class, which is styled to
    // the 44x44px minimum in StepList.module.css.
    it('move up buttons carry the action-button class (44x44px min)', () => {
      const onChange = vi.fn()
      render(<StepList steps={twoSteps} onChange={onChange} getToken={mockGetToken} recipeId="test-recipe-id" />)

      const moveUpButtons = screen.getAllByRole('button', { name: /move up/i })
      moveUpButtons.forEach((button) => {
        expect(button).toHaveClass(styles.actionButton)
      })
    })

    it('move down buttons carry the action-button class (44x44px min)', () => {
      const onChange = vi.fn()
      render(<StepList steps={twoSteps} onChange={onChange} getToken={mockGetToken} recipeId="test-recipe-id" />)

      const moveDownButtons = screen.getAllByRole('button', { name: /move down/i })
      moveDownButtons.forEach((button) => {
        expect(button).toHaveClass(styles.actionButton)
      })
    })

    it('remove buttons carry the action-button class (44x44px min)', () => {
      const onChange = vi.fn()
      render(<StepList steps={twoSteps} onChange={onChange} getToken={mockGetToken} recipeId="test-recipe-id" />)

      const removeButtons = screen.getAllByRole('button', { name: /remove step/i })
      removeButtons.forEach((button) => {
        expect(button).toHaveClass(styles.actionButton)
      })
    })
  })
})
