import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import Textarea from './Textarea'

describe('Textarea', () => {
  it('renders a multiline textbox with the given value, placeholder, and rows', () => {
    render(
      <Textarea
        value="hello"
        placeholder="Type here"
        rows={5}
        ariaLabel="Notes"
        onChange={vi.fn()}
      />
    )

    const textarea = screen.getByRole('textbox', { name: 'Notes' })
    expect(textarea.tagName).toBe('TEXTAREA')
    expect(textarea).toHaveValue('hello')
    expect(textarea).toHaveAttribute('placeholder', 'Type here')
    expect(textarea).toHaveAttribute('rows', '5')
  })

  it('fires onChange when the user types', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Textarea value="" ariaLabel="Notes" onChange={onChange} />)

    await user.type(screen.getByRole('textbox', { name: 'Notes' }), 'a')

    expect(onChange).toHaveBeenCalled()
  })

  it('disables the textarea when disabled is passed', () => {
    render(<Textarea value="" ariaLabel="Notes" disabled onChange={vi.fn()} />)

    expect(screen.getByRole('textbox', { name: 'Notes' })).toBeDisabled()
  })

  it('produces the expected accessible name via ariaLabel', () => {
    render(<Textarea value="" ariaLabel="Additional notes" onChange={vi.fn()} />)

    expect(screen.getByLabelText('Additional notes')).toBeInTheDocument()
  })
})
