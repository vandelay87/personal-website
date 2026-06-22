import type { Step } from '@models/recipe'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import StepList from './StepList'
import styles from './StepList.module.css'

const STEP_ID_1 = '11111111-1111-4111-8111-111111111111'
const STEP_ID_2 = '22222222-2222-4222-8222-222222222222'

const makeStep = (stepId: string, order: number, text: string): Step => ({ stepId, order, text })

const mockGetToken = vi.fn().mockResolvedValue('token-123')

describe('StepList', () => {
  const twoSteps: Step[] = [
    makeStep(STEP_ID_1, 1, 'Preheat oven'),
    makeStep(STEP_ID_2, 2, 'Mix ingredients'),
  ]

  it('renders step rows with text textarea', () => {
    const onChange = vi.fn()
    render(
      <StepList
        steps={twoSteps}
        onChange={onChange}
        getToken={mockGetToken}
        recipeId="test-recipe-id"
        slug="beans-on-toast"
      />
    )

    const textareas = screen.getAllByRole('textbox', { name: /^step \d+ text$/i })
    expect(textareas).toHaveLength(2)
    expect(textareas[0]).toHaveValue('Preheat oven')
    expect(textareas[1]).toHaveValue('Mix ingredients')
  })

  it('step numbers auto-update', () => {
    const onChange = vi.fn()
    render(
      <StepList
        steps={twoSteps}
        onChange={onChange}
        getToken={mockGetToken}
        recipeId="test-recipe-id"
        slug="beans-on-toast"
      />
    )

    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  describe('"Add step" assigns a fresh stepId', () => {
    beforeEach(() => {
      vi.spyOn(crypto, 'randomUUID').mockReturnValue(
        '33333333-3333-4333-8333-333333333333'
      )
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('appends a step carrying a crypto.randomUUID stepId', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(
        <StepList
          steps={twoSteps}
          onChange={onChange}
          getToken={mockGetToken}
          recipeId="test-recipe-id"
          slug="beans-on-toast"
        />
      )

      await user.click(screen.getByRole('button', { name: /add step/i }))

      expect(onChange).toHaveBeenCalledWith([
        ...twoSteps,
        { stepId: '33333333-3333-4333-8333-333333333333', order: 3, text: '' },
      ])
    })
  })

  it('remove button removes a row (minimum 1 enforced)', () => {
    const onChange = vi.fn()
    render(
      <StepList
        steps={[makeStep(STEP_ID_1, 1, 'Only step')]}
        onChange={onChange}
        getToken={mockGetToken}
        recipeId="test-recipe-id"
        slug="beans-on-toast"
      />
    )

    const removeButton = screen.getByRole('button', { name: /remove/i })
    expect(removeButton).toBeDisabled()
  })

  it('move up/down reorder and renumber steps', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <StepList
        steps={twoSteps}
        onChange={onChange}
        getToken={mockGetToken}
        recipeId="test-recipe-id"
        slug="beans-on-toast"
      />
    )

    const moveDownButtons = screen.getAllByRole('button', { name: /move down/i })
    await user.click(moveDownButtons[0])

    expect(onChange).toHaveBeenCalledWith([
      { stepId: STEP_ID_2, order: 1, text: 'Mix ingredients' },
      { stepId: STEP_ID_1, order: 2, text: 'Preheat oven' },
    ])
  })

  // NEW (#198): reordering must keep each step's stepId attached to its content;
  // only `order` changes. This guarantees stepId-keyed image URLs survive reorder.
  it('reordering preserves each step\'s stepId — only order changes', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <StepList
        steps={twoSteps}
        onChange={onChange}
        getToken={mockGetToken}
        recipeId="test-recipe-id"
        slug="beans-on-toast"
      />
    )

    const moveDownButtons = screen.getAllByRole('button', { name: /move down/i })
    await user.click(moveDownButtons[0])

    const next = onChange.mock.calls[0][0] as Step[]
    // The second step's content is now first, but it carries its original stepId.
    expect(next[0]).toMatchObject({ stepId: STEP_ID_2, text: 'Mix ingredients', order: 1 })
    expect(next[1]).toMatchObject({ stepId: STEP_ID_1, text: 'Preheat oven', order: 2 })
    // The set of stepIds is unchanged across the reorder.
    expect(new Set(next.map((s) => s.stepId))).toEqual(new Set([STEP_ID_1, STEP_ID_2]))
  })

  it('after reordering two steps, the rendered step-number labels reflect the new order', async () => {
    const user = userEvent.setup()
    const Wrapper = () => {
      const [steps, setSteps] = useState<Step[]>(twoSteps)
      return (
        <StepList
          steps={steps}
          onChange={setSteps}
          getToken={mockGetToken}
          recipeId="test-recipe-id"
          slug="beans-on-toast"
        />
      )
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
      render(
        <StepList
          steps={twoSteps}
          onChange={onChange}
          getToken={mockGetToken}
          recipeId="test-recipe-id"
          slug="beans-on-toast"
        />
      )

      const uploadButtons = screen.getAllByRole('button', { name: /^upload$/i })
      expect(uploadButtons).toHaveLength(2)

      expect(screen.getByLabelText('Step 1 image alt text')).toBeInTheDocument()
      expect(screen.getByLabelText('Step 2 image alt text')).toBeInTheDocument()
    })

    it('does not render the image upload control when getToken is not provided', () => {
      const onChange = vi.fn()
      render(
        <StepList
          steps={twoSteps}
          onChange={onChange}
          recipeId="test-recipe-id"
          slug="beans-on-toast"
        />
      )

      expect(screen.queryByRole('button', { name: /^upload$/i })).not.toBeInTheDocument()
      expect(screen.queryByLabelText('Step 1 image alt text')).not.toBeInTheDocument()
    })

    it('passes processedAt through to per-step ImageUpload so the correct render branch shows', () => {
      const onChange = vi.fn()
      const unreadyStep: Step = {
        stepId: STEP_ID_1,
        order: 1,
        text: 'Stir',
        image: { alt: 'x' },
      }
      const { rerender } = render(
        <StepList
          steps={[unreadyStep]}
          onChange={onChange}
          getToken={mockGetToken}
          recipeId="test-recipe-id"
          slug="beans-on-toast"
        />
      )

      expect(screen.getByText(/processing image/i)).toBeInTheDocument()
      expect(screen.queryByRole('img')).not.toBeInTheDocument()

      const readyStep: Step = {
        stepId: STEP_ID_1,
        order: 1,
        text: 'Stir',
        image: { alt: 'x', processedAt: 12345 },
      }
      rerender(
        <StepList
          steps={[readyStep]}
          onChange={onChange}
          getToken={mockGetToken}
          recipeId="test-recipe-id"
          slug="beans-on-toast"
        />
      )

      expect(screen.getByRole('img')).toBeInTheDocument()
      expect(screen.queryByText(/processing image/i)).not.toBeInTheDocument()
    })

    it('typing in the alt-text input calls onChange with the updated step (no key field)', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(
        <StepList
          steps={[makeStep(STEP_ID_1, 1, 'Preheat oven')]}
          onChange={onChange}
          getToken={mockGetToken}
          recipeId="test-recipe-id"
          slug="beans-on-toast"
        />
      )

      const altInput = screen.getByLabelText('Step 1 image alt text')
      await user.type(altInput, 'A')

      expect(onChange).toHaveBeenCalledWith([
        { stepId: STEP_ID_1, order: 1, text: 'Preheat oven', image: { alt: 'A' } },
      ])
    })
  })

  describe('accessibility — touch targets', () => {
    it('move up buttons carry the action-button class (44x44px min)', () => {
      const onChange = vi.fn()
      render(
        <StepList
          steps={twoSteps}
          onChange={onChange}
          getToken={mockGetToken}
          recipeId="test-recipe-id"
          slug="beans-on-toast"
        />
      )

      const moveUpButtons = screen.getAllByRole('button', { name: /move up/i })
      moveUpButtons.forEach((button) => {
        expect(button).toHaveClass(styles.actionButton)
      })
    })

    it('move down buttons carry the action-button class (44x44px min)', () => {
      const onChange = vi.fn()
      render(
        <StepList
          steps={twoSteps}
          onChange={onChange}
          getToken={mockGetToken}
          recipeId="test-recipe-id"
          slug="beans-on-toast"
        />
      )

      const moveDownButtons = screen.getAllByRole('button', { name: /move down/i })
      moveDownButtons.forEach((button) => {
        expect(button).toHaveClass(styles.actionButton)
      })
    })

    it('remove buttons carry the action-button class (44x44px min)', () => {
      const onChange = vi.fn()
      render(
        <StepList
          steps={twoSteps}
          onChange={onChange}
          getToken={mockGetToken}
          recipeId="test-recipe-id"
          slug="beans-on-toast"
        />
      )

      const removeButtons = screen.getAllByRole('button', { name: /remove step/i })
      removeButtons.forEach((button) => {
        expect(button).toHaveClass(styles.actionButton)
      })
    })
  })
})
