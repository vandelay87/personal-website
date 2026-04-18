import type { Step } from '@models/recipe'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import StepList from './StepList'
import styles from './StepList.module.css'

const makeStep = (order: number, text: string): Step => ({ order, text })

const mockGetToken = vi.fn().mockResolvedValue('token-123')

describe('StepList', () => {
  const twoSteps: Step[] = [makeStep(1, 'Preheat oven'), makeStep(2, 'Mix ingredients')]

  it('renders step rows with text textarea', () => {
    const onChange = vi.fn()
    render(<StepList steps={twoSteps} onChange={onChange} getToken={mockGetToken} />)

    const textareas = screen.getAllByRole('textbox', { name: /^step \d+ text$/i })
    expect(textareas).toHaveLength(2)
    expect(textareas[0]).toHaveValue('Preheat oven')
    expect(textareas[1]).toHaveValue('Mix ingredients')
  })

  it('step numbers auto-update', () => {
    const onChange = vi.fn()
    render(<StepList steps={twoSteps} onChange={onChange} getToken={mockGetToken} />)

    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('"Add step" button adds new row', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<StepList steps={twoSteps} onChange={onChange} getToken={mockGetToken} />)

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
      <StepList steps={[makeStep(1, 'Only step')]} onChange={onChange} getToken={mockGetToken} />
    )

    const removeButton = screen.getByRole('button', { name: /remove/i })
    expect(removeButton).toBeDisabled()
  })

  it('move up/down reorder and renumber steps', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<StepList steps={twoSteps} onChange={onChange} getToken={mockGetToken} />)

    const moveDownButtons = screen.getAllByRole('button', { name: /move down/i })
    await user.click(moveDownButtons[0])

    expect(onChange).toHaveBeenCalledWith([
      { order: 1, text: 'Mix ingredients' },
      { order: 2, text: 'Preheat oven' },
    ])
  })

  describe('accessibility — touch targets', () => {
    // Note: jsdom does not apply CSS Modules styles to computed style, so we
    // assert the button carries the action-button class, which is styled to
    // the 44x44px minimum in StepList.module.css.
    it('move up buttons carry the action-button class (44x44px min)', () => {
      const onChange = vi.fn()
      render(<StepList steps={twoSteps} onChange={onChange} getToken={mockGetToken} />)

      const moveUpButtons = screen.getAllByRole('button', { name: /move up/i })
      moveUpButtons.forEach((button) => {
        expect(button).toHaveClass(styles.actionButton)
      })
    })

    it('move down buttons carry the action-button class (44x44px min)', () => {
      const onChange = vi.fn()
      render(<StepList steps={twoSteps} onChange={onChange} getToken={mockGetToken} />)

      const moveDownButtons = screen.getAllByRole('button', { name: /move down/i })
      moveDownButtons.forEach((button) => {
        expect(button).toHaveClass(styles.actionButton)
      })
    })

    it('remove buttons carry the action-button class (44x44px min)', () => {
      const onChange = vi.fn()
      render(<StepList steps={twoSteps} onChange={onChange} getToken={mockGetToken} />)

      const removeButtons = screen.getAllByRole('button', { name: /remove step/i })
      removeButtons.forEach((button) => {
        expect(button).toHaveClass(styles.actionButton)
      })
    })
  })
})
