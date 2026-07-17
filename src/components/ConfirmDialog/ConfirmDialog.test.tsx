import ConfirmDialog from '@components/ConfirmDialog'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState, type FC } from 'react'

describe('ConfirmDialog', () => {
  let mockOnConfirm = vi.fn()
  let mockOnCancel = vi.fn()

  beforeEach(() => {
    mockOnConfirm = vi.fn()
    mockOnCancel = vi.fn()
  })

  it('renders title and children when open is true', () => {
    render(
      <ConfirmDialog
        title="Delete recipe"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        open={true}
      >
        Are you sure you want to delete this recipe?
      </ConfirmDialog>
    )

    expect(screen.getByText('Delete recipe')).toBeInTheDocument()
    expect(screen.getByText('Are you sure you want to delete this recipe?')).toBeInTheDocument()
  })

  it('does not render content when open is false', () => {
    render(
      <ConfirmDialog
        title="Delete recipe"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        open={false}
      >
        Are you sure you want to delete this recipe?
      </ConfirmDialog>
    )

    expect(screen.queryByText('Delete recipe')).not.toBeInTheDocument()
    expect(
      screen.queryByText('Are you sure you want to delete this recipe?')
    ).not.toBeInTheDocument()
  })

  it('has an accessible dialog role with aria-labelledby pointing at the title', () => {
    render(
      <ConfirmDialog title="Delete recipe" onConfirm={mockOnConfirm} onCancel={mockOnCancel} open>
        Are you sure you want to delete this recipe?
      </ConfirmDialog>
    )

    const dialog = screen.getByRole('dialog')

    expect(dialog).toBeInTheDocument()
    expect(dialog).toHaveAttribute('aria-labelledby')

    const labelId = dialog.getAttribute('aria-labelledby')

    expect(document.getElementById(labelId!)).toHaveTextContent('Delete recipe')
  })

  it('calls onConfirm when the confirm button is clicked', () => {
    render(
      <ConfirmDialog title="Delete recipe" onConfirm={mockOnConfirm} onCancel={mockOnCancel} open>
        Are you sure you want to delete this recipe?
      </ConfirmDialog>
    )

    fireEvent.click(screen.getByRole('button', { name: /confirm/i }))

    expect(mockOnConfirm).toHaveBeenCalledTimes(1)
  })

  it('calls onCancel when the cancel button is clicked', () => {
    render(
      <ConfirmDialog title="Delete recipe" onConfirm={mockOnConfirm} onCancel={mockOnCancel} open>
        Are you sure you want to delete this recipe?
      </ConfirmDialog>
    )

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))

    expect(mockOnCancel).toHaveBeenCalledTimes(1)
  })

  it('renders the danger variant with the given confirm label, still queryable by role/name', () => {
    render(
      <ConfirmDialog
        title="Delete recipe"
        confirmLabel="Delete"
        danger
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        open
      >
        Are you sure you want to delete this recipe?
      </ConfirmDialog>
    )

    expect(screen.getByRole('heading', { name: /delete recipe/i })).toBeInTheDocument()

    const confirmButton = screen.getByRole('button', { name: 'Delete' })
    expect(confirmButton).toBeInTheDocument()

    fireEvent.click(confirmButton)
    expect(mockOnConfirm).toHaveBeenCalledTimes(1)
  })

  it('moves focus into the dialog when it opens', () => {
    render(
      <ConfirmDialog title="Delete recipe" onConfirm={mockOnConfirm} onCancel={mockOnCancel} open>
        Are you sure you want to delete this recipe?
      </ConfirmDialog>
    )

    const dialog = screen.getByRole('dialog')

    expect(dialog).toContainElement(document.activeElement as HTMLElement)
  })

  it('restores focus to the triggering element after close', async () => {
    // A harness that owns `open` state so the ConfirmDialog transitions from
    // closed -> open -> closed, exercising the real trigger-focus save and
    // close-triggered restore (jsdom does not auto-focus on mount the way a
    // browser does, so the trigger's focus has to come from a real
    // interaction before the dialog opens).
    const Harness: FC = () => {
      const [open, setOpen] = useState(false)
      return (
        <>
          <button onClick={() => setOpen(true)}>Open dialog</button>
          <ConfirmDialog
            title="Delete recipe"
            onConfirm={mockOnConfirm}
            onCancel={() => setOpen(false)}
            open={open}
          >
            Are you sure you want to delete this recipe?
          </ConfirmDialog>
        </>
      )
    }

    const user = userEvent.setup()
    render(<Harness />)

    const trigger = screen.getByRole('button', { name: /open dialog/i })
    await user.click(trigger)

    const cancelButton = await screen.findByRole('button', { name: /cancel/i })
    await user.click(cancelButton)

    expect(document.activeElement).toBe(trigger)
  })

  it('closes on the native dialog cancel event (fired by the browser on Escape)', () => {
    render(
      <ConfirmDialog title="Delete recipe" onConfirm={mockOnConfirm} onCancel={mockOnCancel} open>
        Are you sure you want to delete this recipe?
      </ConfirmDialog>
    )

    const dialog = screen.getByRole('dialog')
    fireEvent(dialog, new Event('cancel', { cancelable: true }))

    expect(mockOnCancel).toHaveBeenCalledTimes(1)
  })

  it('clicking the scrim outside the rendered dialog box closes it', () => {
    render(
      <ConfirmDialog title="Delete recipe" onConfirm={mockOnConfirm} onCancel={mockOnCancel} open>
        Are you sure you want to delete this recipe?
      </ConfirmDialog>
    )

    const dialog = screen.getByRole('dialog')
    vi.spyOn(dialog, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      right: 300,
      top: 100,
      bottom: 300,
      width: 200,
      height: 200,
      x: 100,
      y: 100,
      toJSON: () => {},
    })

    fireEvent.click(dialog, { clientX: 10, clientY: 10 })

    expect(mockOnCancel).toHaveBeenCalledTimes(1)
  })

  it('clicking inside the rendered dialog box (its own padding) does not close it — regression for the scrim-click bug', () => {
    render(
      <ConfirmDialog title="Delete recipe" onConfirm={mockOnConfirm} onCancel={mockOnCancel} open>
        Are you sure you want to delete this recipe?
      </ConfirmDialog>
    )

    const dialog = screen.getByRole('dialog')
    vi.spyOn(dialog, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      right: 300,
      top: 100,
      bottom: 300,
      width: 200,
      height: 200,
      x: 100,
      y: 100,
      toJSON: () => {},
    })

    // Clicking in the dialog's own padding still has `target === dialog`
    // (no inner wrapper), but the coordinates fall inside the rendered box —
    // this must NOT be treated as a scrim click.
    fireEvent.click(dialog, { clientX: 150, clientY: 150 })

    expect(mockOnCancel).not.toHaveBeenCalled()
  })
})
