import Button from '@components/Button'
import { render, screen, fireEvent } from '@testing-library/react'

describe('Button Component', () => {
  let mockOnClick = vi.fn()

  beforeEach(() => {
    mockOnClick = vi.fn()
  })

  it('renders the button correctly with children', () => {
    render(<Button onClick={mockOnClick}>Click Me</Button>)

    const button = screen.getByRole('button', { name: /click me/i })

    expect(button).toBeInTheDocument()
    expect(button).toHaveTextContent('Click Me')
  })

  it('fires the onClick handler when clicked', () => {
    render(<Button onClick={mockOnClick}>Click Me</Button>)

    const button = screen.getByRole('button', { name: /click me/i })

    fireEvent.click(button)

    expect(mockOnClick).toHaveBeenCalledTimes(1)
  })

  it('does not trigger onClick when button is disabled', () => {
    render(
      <Button onClick={mockOnClick} disabled>
        Click Me
      </Button>
    )

    const button = screen.getByRole('button', { name: /click me/i })

    expect(button).toBeDisabled()

    fireEvent.click(button)

    expect(mockOnClick).not.toHaveBeenCalled()
  })

  it('applies the correct classes for disabled state', () => {
    render(
      <Button onClick={mockOnClick} disabled>
        Disabled Button
      </Button>
    )

    const button = screen.getByRole('button', { name: /disabled button/i })

    expect(button).toHaveClass('disabled:cursor-not-allowed')
  })
})
