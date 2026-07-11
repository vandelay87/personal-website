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

  // Keyboard navigation (#237). Bounds behaviour chosen: ArrowDown/ArrowUp CLAMP
  // at the first/last option rather than wrapping around.

  it('ArrowDown highlights the first suggestion via aria-selected, leaving others unselected', () => {
    render(
      <TagInput
        tags={[]}
        onChange={mockOnChange}
        existingTags={['Italian', 'Indian', 'Irish']}
      />
    )

    const input = screen.getByRole('combobox')
    fireEvent.change(input, { target: { value: 'I' } })

    fireEvent.keyDown(input, { key: 'ArrowDown' })

    const options = screen.getAllByRole('option')
    expect(options[0]).toHaveAttribute('aria-selected', 'true')
    expect(options[1]).toHaveAttribute('aria-selected', 'false')
    expect(options[2]).toHaveAttribute('aria-selected', 'false')
  })

  it('ArrowDown pressed again moves the highlight to the next suggestion', () => {
    render(
      <TagInput
        tags={[]}
        onChange={mockOnChange}
        existingTags={['Italian', 'Indian', 'Irish']}
      />
    )

    const input = screen.getByRole('combobox')
    fireEvent.change(input, { target: { value: 'I' } })

    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'ArrowDown' })

    const options = screen.getAllByRole('option')
    expect(options[0]).toHaveAttribute('aria-selected', 'false')
    expect(options[1]).toHaveAttribute('aria-selected', 'true')
    expect(options[2]).toHaveAttribute('aria-selected', 'false')
  })

  it('ArrowDown stops at the last suggestion instead of wrapping back to the first', () => {
    render(
      <TagInput
        tags={[]}
        onChange={mockOnChange}
        existingTags={['Italian', 'Indian', 'Irish']}
      />
    )

    const input = screen.getByRole('combobox')
    fireEvent.change(input, { target: { value: 'I' } })

    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'ArrowDown' })

    const options = screen.getAllByRole('option')
    expect(options[0]).toHaveAttribute('aria-selected', 'false')
    expect(options[1]).toHaveAttribute('aria-selected', 'false')
    expect(options[2]).toHaveAttribute('aria-selected', 'true')
  })

  it('ArrowUp moves the highlight back to the previous suggestion', () => {
    render(
      <TagInput
        tags={[]}
        onChange={mockOnChange}
        existingTags={['Italian', 'Indian', 'Irish']}
      />
    )

    const input = screen.getByRole('combobox')
    fireEvent.change(input, { target: { value: 'I' } })

    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'ArrowUp' })

    const options = screen.getAllByRole('option')
    expect(options[0]).toHaveAttribute('aria-selected', 'true')
    expect(options[1]).toHaveAttribute('aria-selected', 'false')
    expect(options[2]).toHaveAttribute('aria-selected', 'false')
  })

  it('ArrowUp stops at the first suggestion instead of wrapping to the last', () => {
    render(
      <TagInput
        tags={[]}
        onChange={mockOnChange}
        existingTags={['Italian', 'Indian', 'Irish']}
      />
    )

    const input = screen.getByRole('combobox')
    fireEvent.change(input, { target: { value: 'I' } })

    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    fireEvent.keyDown(input, { key: 'ArrowUp' })

    const options = screen.getAllByRole('option')
    expect(options[0]).toHaveAttribute('aria-selected', 'true')
    expect(options[1]).toHaveAttribute('aria-selected', 'false')
    expect(options[2]).toHaveAttribute('aria-selected', 'false')
  })

  it('Enter adds the highlighted suggestion, not the raw combobox text', () => {
    render(
      <TagInput
        tags={[]}
        onChange={mockOnChange}
        existingTags={['Italian', 'Indian', 'Irish']}
      />
    )

    const input = screen.getByRole('combobox')
    fireEvent.change(input, { target: { value: 'I' } })

    // Highlight the second option ("Indian"), which does not match the raw
    // input text "I" verbatim.
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(mockOnChange).toHaveBeenCalledWith(['Indian'])
    expect(mockOnChange).not.toHaveBeenCalledWith(['I'])
  })

  it('Escape closes the suggestion list without adding a tag', () => {
    render(
      <TagInput
        tags={[]}
        onChange={mockOnChange}
        existingTags={['Italian', 'Indian', 'Irish']}
      />
    )

    const input = screen.getByRole('combobox')
    fireEvent.change(input, { target: { value: 'I' } })
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'Escape' })

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(mockOnChange).not.toHaveBeenCalled()
  })

  it('ArrowDown/ArrowUp are no-ops when no suggestions are open', () => {
    render(<TagInput tags={[]} onChange={mockOnChange} existingTags={['Italian']} />)

    const input = screen.getByRole('combobox')

    expect(() => {
      fireEvent.keyDown(input, { key: 'ArrowDown' })
      fireEvent.keyDown(input, { key: 'ArrowUp' })
    }).not.toThrow()

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(input).toHaveValue('')
    expect(mockOnChange).not.toHaveBeenCalled()
  })

  // aria-activedescendant tracking (#237)

  it('has no aria-activedescendant on initial render', () => {
    render(<TagInput tags={[]} onChange={mockOnChange} existingTags={['Italian']} />)

    const input = screen.getByRole('combobox')

    expect(input).not.toHaveAttribute('aria-activedescendant')
  })

  it('has no aria-activedescendant after typing, before any arrow key press', () => {
    render(
      <TagInput
        tags={[]}
        onChange={mockOnChange}
        existingTags={['Italian', 'Indian', 'Irish']}
      />
    )

    const input = screen.getByRole('combobox')
    fireEvent.change(input, { target: { value: 'I' } })

    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(input).not.toHaveAttribute('aria-activedescendant')
  })

  it('sets aria-activedescendant to the highlighted option id and updates it as ArrowDown moves', () => {
    render(
      <TagInput
        tags={[]}
        onChange={mockOnChange}
        existingTags={['Italian', 'Indian', 'Irish']}
      />
    )

    const input = screen.getByRole('combobox')
    fireEvent.change(input, { target: { value: 'I' } })

    fireEvent.keyDown(input, { key: 'ArrowDown' })

    let options = screen.getAllByRole('option')
    expect(input.getAttribute('aria-activedescendant')).toBe(options[0].id)

    fireEvent.keyDown(input, { key: 'ArrowDown' })

    options = screen.getAllByRole('option')
    expect(input.getAttribute('aria-activedescendant')).toBe(options[1].id)
  })

  it('has no aria-activedescendant after Escape resets the highlight', () => {
    render(
      <TagInput
        tags={[]}
        onChange={mockOnChange}
        existingTags={['Italian', 'Indian', 'Irish']}
      />
    )

    const input = screen.getByRole('combobox')
    fireEvent.change(input, { target: { value: 'I' } })

    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'Escape' })

    expect(input).not.toHaveAttribute('aria-activedescendant')
  })

  it('has no aria-activedescendant after Enter adds the highlighted tag', () => {
    render(
      <TagInput
        tags={[]}
        onChange={mockOnChange}
        existingTags={['Italian', 'Indian', 'Irish']}
      />
    )

    const input = screen.getByRole('combobox')
    fireEvent.change(input, { target: { value: 'I' } })

    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(input).not.toHaveAttribute('aria-activedescendant')
  })
})
