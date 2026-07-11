import Tag from '@components/Tag'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

describe('Tag', () => {
  it('as="button" exposes aria-pressed reflecting `active` and toggles via click', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()

    const { rerender } = render(
      <Tag as="button" active={false} onClick={handleClick}>
        Italian
      </Tag>
    )

    const chip = screen.getByRole('button', { name: 'Italian' })
    expect(chip).toHaveAttribute('aria-pressed', 'false')

    await user.click(chip)
    expect(handleClick).toHaveBeenCalledTimes(1)

    rerender(
      <Tag as="button" active={true} onClick={handleClick}>
        Italian
      </Tag>
    )
    expect(screen.getByRole('button', { name: 'Italian' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('as="span" (default) does not expose a button role or aria-pressed', () => {
    render(<Tag active>Italian</Tag>)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()

    const tag = screen.getByText('Italian')
    expect(tag).not.toHaveAttribute('aria-pressed')
  })

  it('removable renders a control with an accessible name that calls onRemove when activated', async () => {
    const user = userEvent.setup()
    const handleRemove = vi.fn()

    render(
      <Tag removable onRemove={handleRemove}>
        Italian
      </Tag>
    )

    const removeControl = screen.getByRole('button', { name: /remove italian/i })
    await user.click(removeControl)

    expect(handleRemove).toHaveBeenCalledTimes(1)
  })

  it('as="a" with an internal "to" renders a router link with the correct href', () => {
    render(
      <MemoryRouter>
        <Tag as="a" to="/blog?tag=italian">
          Italian
        </Tag>
      </MemoryRouter>
    )

    const link = screen.getByRole('link', { name: 'Italian' })
    expect(link).toHaveAttribute('href', '/blog?tag=italian')
    expect(link).not.toHaveAttribute('target')
  })

  it('as="a" with an external "to" opens in a new tab safely', () => {
    render(
      <MemoryRouter>
        <Tag as="a" to="https://example.com">
          Italian
        </Tag>
      </MemoryRouter>
    )

    const link = screen.getByRole('link', { name: 'Italian' })
    expect(link).toHaveAttribute('href', 'https://example.com')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noreferrer')
  })
})
