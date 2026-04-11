import Toast from '@components/Toast'
import { render, screen, fireEvent, act } from '@testing-library/react'

describe('Toast', () => {
  let mockOnDismiss = vi.fn()

  beforeEach(() => {
    mockOnDismiss = vi.fn()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders message text', () => {
    render(<Toast message="Recipe saved" type="success" onDismiss={mockOnDismiss} />)

    expect(screen.getByText('Recipe saved')).toBeInTheDocument()
  })

  it('has role="status" and aria-live="polite"', () => {
    render(<Toast message="Recipe saved" type="success" onDismiss={mockOnDismiss} />)

    const toast = screen.getByRole('status')

    expect(toast).toBeInTheDocument()
    expect(toast).toHaveAttribute('aria-live', 'polite')
  })

  it('calls onDismiss after 5 seconds', () => {
    render(<Toast message="Recipe saved" type="success" onDismiss={mockOnDismiss} />)

    expect(mockOnDismiss).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(mockOnDismiss).toHaveBeenCalledTimes(1)
  })

  it('has a close button that calls onDismiss on click', () => {
    render(<Toast message="Recipe saved" type="success" onDismiss={mockOnDismiss} />)

    const closeButton = screen.getByRole('button', { name: /close/i })

    fireEvent.click(closeButton)

    expect(mockOnDismiss).toHaveBeenCalledTimes(1)
  })

  it('auto-dismiss timer is cleared on unmount', () => {
    const { unmount } = render(
      <Toast message="Recipe saved" type="success" onDismiss={mockOnDismiss} />
    )

    unmount()

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(mockOnDismiss).not.toHaveBeenCalled()
  })
})
