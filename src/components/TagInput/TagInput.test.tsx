import TagInput from '@components/TagInput'
import { render, screen, fireEvent } from '@testing-library/react'

describe('TagInput', () => {
  let mockOnChange = vi.fn()

  beforeEach(() => {
    mockOnChange = vi.fn()
  })

  it('renders input with role="combobox"', () => {
    render(<TagInput tags={[]} onChange={mockOnChange} />)

    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('shows autocomplete dropdown matching input text when existingTags provided', () => {
    render(
      <TagInput tags={[]} onChange={mockOnChange} existingTags={['Italian', 'Indian', 'Irish']} />
    )

    const input = screen.getByRole('combobox')

    fireEvent.change(input, { target: { value: 'It' } })

    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(screen.getByText('Italian')).toBeInTheDocument()
    expect(screen.queryByText('Irish')).not.toBeInTheDocument()
  })

  it('adds tag on Enter press', () => {
    render(<TagInput tags={['Vegan']} onChange={mockOnChange} />)

    const input = screen.getByRole('combobox')

    fireEvent.change(input, { target: { value: 'Quick' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(mockOnChange).toHaveBeenCalledWith(['Vegan', 'Quick'])
  })

  it('adds tag on clicking suggestion', () => {
    render(
      <TagInput tags={[]} onChange={mockOnChange} existingTags={['Italian', 'Indian']} />
    )

    const input = screen.getByRole('combobox')

    fireEvent.change(input, { target: { value: 'Ita' } })
    fireEvent.click(screen.getByText('Italian'))

    expect(mockOnChange).toHaveBeenCalledWith(['Italian'])
  })

  it('creates new tag for non-matching input on Enter', () => {
    render(
      <TagInput tags={[]} onChange={mockOnChange} existingTags={['Italian', 'Indian']} />
    )

    const input = screen.getByRole('combobox')

    fireEvent.change(input, { target: { value: 'Mexican' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(mockOnChange).toHaveBeenCalledWith(['Mexican'])
  })

  it('removes tag when X chip button clicked', () => {
    render(<TagInput tags={['Vegan', 'Quick']} onChange={mockOnChange} />)

    const removeButtons = screen.getAllByRole('button', { name: /remove/i })

    fireEvent.click(removeButtons[0])

    expect(mockOnChange).toHaveBeenCalledWith(['Quick'])
  })

  it('has aria-expanded attribute', () => {
    render(<TagInput tags={[]} onChange={mockOnChange} existingTags={['Italian']} />)

    const input = screen.getByRole('combobox')

    expect(input).toHaveAttribute('aria-expanded', 'false')

    fireEvent.change(input, { target: { value: 'It' } })

    expect(input).toHaveAttribute('aria-expanded', 'true')
  })
})
