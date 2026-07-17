import Toast from '@components/Toast'
import { render, screen, fireEvent } from '@testing-library/react'

describe('Toast', () => {
  let mockOnDismiss = vi.fn()

  beforeEach(() => {
    mockOnDismiss = vi.fn()
  })

  it('renders its message text', () => {
    render(<Toast tone="success">Recipe saved</Toast>)

    expect(screen.getByText('Recipe saved')).toBeInTheDocument()
  })

  it('is a single button so the whole pill is clickable to dismiss', () => {
    render(
      <Toast tone="success" onDismiss={mockOnDismiss}>
        Recipe saved
      </Toast>
    )

    const toast = screen.getByRole('button', { name: /recipe saved/i })

    fireEvent.click(toast)

    expect(mockOnDismiss).toHaveBeenCalledTimes(1)
  })
})
