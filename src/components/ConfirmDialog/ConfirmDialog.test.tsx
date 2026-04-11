import ConfirmDialog from '@components/ConfirmDialog'
import { render, screen, fireEvent } from '@testing-library/react'

describe('ConfirmDialog', () => {
  let mockOnConfirm = vi.fn()
  let mockOnCancel = vi.fn()

  beforeEach(() => {
    mockOnConfirm = vi.fn()
    mockOnCancel = vi.fn()
  })

  it('renders title and message when isOpen is true', () => {
    render(
      <ConfirmDialog
        title="Delete recipe"
        message="Are you sure you want to delete this recipe?"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        isOpen={true}
      />
    )

    expect(screen.getByText('Delete recipe')).toBeInTheDocument()
    expect(screen.getByText('Are you sure you want to delete this recipe?')).toBeInTheDocument()
  })

  it('does not render when isOpen is false', () => {
    render(
      <ConfirmDialog
        title="Delete recipe"
        message="Are you sure you want to delete this recipe?"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        isOpen={false}
      />
    )

    expect(screen.queryByText('Delete recipe')).not.toBeInTheDocument()
    expect(
      screen.queryByText('Are you sure you want to delete this recipe?')
    ).not.toBeInTheDocument()
  })

  it('has role="dialog" with aria-labelledby', () => {
    render(
      <ConfirmDialog
        title="Delete recipe"
        message="Are you sure you want to delete this recipe?"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        isOpen={true}
      />
    )

    const dialog = screen.getByRole('dialog')

    expect(dialog).toBeInTheDocument()
    expect(dialog).toHaveAttribute('aria-labelledby')

    const labelId = dialog.getAttribute('aria-labelledby')

    expect(document.getElementById(labelId!)).toHaveTextContent('Delete recipe')
  })

  it('calls onConfirm when confirm button clicked', () => {
    render(
      <ConfirmDialog
        title="Delete recipe"
        message="Are you sure you want to delete this recipe?"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        isOpen={true}
      />
    )

    const confirmButton = screen.getByRole('button', { name: /confirm/i })

    fireEvent.click(confirmButton)

    expect(mockOnConfirm).toHaveBeenCalledTimes(1)
  })

  it('calls onCancel when cancel button clicked', () => {
    render(
      <ConfirmDialog
        title="Delete recipe"
        message="Are you sure you want to delete this recipe?"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        isOpen={true}
      />
    )

    const cancelButton = screen.getByRole('button', { name: /cancel/i })

    fireEvent.click(cancelButton)

    expect(mockOnCancel).toHaveBeenCalledTimes(1)
  })

  it('traps focus within the dialog', () => {
    render(
      <ConfirmDialog
        title="Delete recipe"
        message="Are you sure you want to delete this recipe?"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        isOpen={true}
      />
    )

    const dialog = screen.getByRole('dialog')
    const focusableElements = dialog.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement

    lastFocusable.focus()
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: false })

    const firstFocusable = focusableElements[0] as HTMLElement

    expect(document.activeElement).toBe(firstFocusable)
  })
})
