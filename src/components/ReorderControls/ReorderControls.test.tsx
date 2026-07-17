import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import ReorderControls from './ReorderControls'

describe('ReorderControls', () => {
  it('renders three buttons with accessible names derived from itemLabel/index', () => {
    render(
      <ReorderControls
        index={0}
        count={3}
        itemLabel="ingredient"
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
        onRemove={vi.fn()}
        moveActionClassName="move"
        removeActionClassName="remove"
      />
    )

    expect(screen.getByRole('button', { name: 'Move up ingredient 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Move down ingredient 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove ingredient 1' })).toBeInTheDocument()
  })

  it('disables the move-up button when index is 0', () => {
    render(
      <ReorderControls
        index={0}
        count={3}
        itemLabel="ingredient"
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
        onRemove={vi.fn()}
        moveActionClassName="move"
        removeActionClassName="remove"
      />
    )

    expect(screen.getByRole('button', { name: 'Move up ingredient 1' })).toBeDisabled()
  })

  it('enables the move-up button when index is not 0', () => {
    render(
      <ReorderControls
        index={1}
        count={3}
        itemLabel="ingredient"
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
        onRemove={vi.fn()}
        moveActionClassName="move"
        removeActionClassName="remove"
      />
    )

    expect(screen.getByRole('button', { name: 'Move up ingredient 2' })).toBeEnabled()
  })

  it('disables the move-down button when index is the last item', () => {
    render(
      <ReorderControls
        index={2}
        count={3}
        itemLabel="ingredient"
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
        onRemove={vi.fn()}
        moveActionClassName="move"
        removeActionClassName="remove"
      />
    )

    expect(screen.getByRole('button', { name: 'Move down ingredient 3' })).toBeDisabled()
  })

  it('enables the move-down button when index is not the last item', () => {
    render(
      <ReorderControls
        index={0}
        count={3}
        itemLabel="ingredient"
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
        onRemove={vi.fn()}
        moveActionClassName="move"
        removeActionClassName="remove"
      />
    )

    expect(screen.getByRole('button', { name: 'Move down ingredient 1' })).toBeEnabled()
  })

  it('disables the remove button when count is 1', () => {
    render(
      <ReorderControls
        index={0}
        count={1}
        itemLabel="ingredient"
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
        onRemove={vi.fn()}
        moveActionClassName="move"
        removeActionClassName="remove"
      />
    )

    expect(screen.getByRole('button', { name: 'Remove ingredient 1' })).toBeDisabled()
  })

  it('enables the remove button when count is greater than 1', () => {
    render(
      <ReorderControls
        index={0}
        count={2}
        itemLabel="ingredient"
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
        onRemove={vi.fn()}
        moveActionClassName="move"
        removeActionClassName="remove"
      />
    )

    expect(screen.getByRole('button', { name: 'Remove ingredient 1' })).toBeEnabled()
  })

  it('calls onMoveUp with the current index when the move-up button is clicked', () => {
    const onMoveUp = vi.fn()
    render(
      <ReorderControls
        index={1}
        count={3}
        itemLabel="step"
        onMoveUp={onMoveUp}
        onMoveDown={vi.fn()}
        onRemove={vi.fn()}
        moveActionClassName="move"
        removeActionClassName="remove"
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Move up step 2' }))

    expect(onMoveUp).toHaveBeenCalledTimes(1)
    expect(onMoveUp).toHaveBeenCalledWith(1)
  })

  it('calls onMoveDown with the current index when the move-down button is clicked', () => {
    const onMoveDown = vi.fn()
    render(
      <ReorderControls
        index={0}
        count={3}
        itemLabel="step"
        onMoveUp={vi.fn()}
        onMoveDown={onMoveDown}
        onRemove={vi.fn()}
        moveActionClassName="move"
        removeActionClassName="remove"
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Move down step 1' }))

    expect(onMoveDown).toHaveBeenCalledTimes(1)
    expect(onMoveDown).toHaveBeenCalledWith(0)
  })

  it('calls onRemove with the current index when the remove button is clicked', () => {
    const onRemove = vi.fn()
    render(
      <ReorderControls
        index={2}
        count={3}
        itemLabel="step"
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
        onRemove={onRemove}
        moveActionClassName="move"
        removeActionClassName="remove"
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Remove step 3' }))

    expect(onRemove).toHaveBeenCalledTimes(1)
    expect(onRemove).toHaveBeenCalledWith(2)
  })
})
