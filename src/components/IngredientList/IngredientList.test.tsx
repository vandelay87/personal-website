import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Ingredient } from '@types/recipe'
import { describe, expect, it, vi } from 'vitest'

import IngredientList from './IngredientList'

const makeIngredient = (item: string, quantity = '', unit = ''): Ingredient => ({
  item,
  quantity,
  unit,
})

describe('IngredientList', () => {
  const twoIngredients: Ingredient[] = [
    makeIngredient('Flour', '200', 'g'),
    makeIngredient('Sugar', '100', 'g'),
  ]

  it('renders ingredient rows with quantity, unit, item inputs', () => {
    const onChange = vi.fn()
    render(<IngredientList ingredients={twoIngredients} onChange={onChange} />)

    const quantityInputs = screen.getAllByRole('textbox', { name: /quantity/i })
    const unitInputs = screen.getAllByRole('textbox', { name: /unit/i })
    const itemInputs = screen.getAllByRole('textbox', { name: /item/i })

    expect(quantityInputs).toHaveLength(2)
    expect(unitInputs).toHaveLength(2)
    expect(itemInputs).toHaveLength(2)
    expect(itemInputs[0]).toHaveValue('Flour')
    expect(itemInputs[1]).toHaveValue('Sugar')
  })

  it('"Add ingredient" button adds a new empty row', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<IngredientList ingredients={twoIngredients} onChange={onChange} />)

    const addButton = screen.getByRole('button', { name: /add ingredient/i })
    await user.click(addButton)

    expect(onChange).toHaveBeenCalledWith([
      ...twoIngredients,
      { item: '', quantity: '', unit: '' },
    ])
  })

  it('remove button removes a row', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<IngredientList ingredients={twoIngredients} onChange={onChange} />)

    const removeButtons = screen.getAllByRole('button', { name: /remove/i })
    await user.click(removeButtons[0])

    expect(onChange).toHaveBeenCalledWith([twoIngredients[1]])
  })

  it('remove is disabled on the last row (minimum 1)', () => {
    const onChange = vi.fn()
    render(<IngredientList ingredients={[makeIngredient('Flour')]} onChange={onChange} />)

    const removeButton = screen.getByRole('button', { name: /remove/i })
    expect(removeButton).toBeDisabled()
  })

  it('move up/down buttons reorder rows', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<IngredientList ingredients={twoIngredients} onChange={onChange} />)

    const moveDownButtons = screen.getAllByRole('button', { name: /move down/i })
    await user.click(moveDownButtons[0])

    expect(onChange).toHaveBeenCalledWith([twoIngredients[1], twoIngredients[0]])
  })

  it('move up disabled on first row, move down disabled on last', () => {
    const onChange = vi.fn()
    render(<IngredientList ingredients={twoIngredients} onChange={onChange} />)

    const moveUpButtons = screen.getAllByRole('button', { name: /move up/i })
    const moveDownButtons = screen.getAllByRole('button', { name: /move down/i })

    expect(moveUpButtons[0]).toBeDisabled()
    expect(moveDownButtons[moveDownButtons.length - 1]).toBeDisabled()
  })

  it('move buttons have descriptive aria-label', () => {
    const onChange = vi.fn()
    render(<IngredientList ingredients={twoIngredients} onChange={onChange} />)

    const moveUpButtons = screen.getAllByRole('button', { name: /move up/i })
    const moveDownButtons = screen.getAllByRole('button', { name: /move down/i })

    expect(moveUpButtons.length).toBeGreaterThan(0)
    expect(moveDownButtons.length).toBeGreaterThan(0)
  })
})
