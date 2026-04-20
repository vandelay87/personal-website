import StatusBadge from '@components/StatusBadge'
import { render, screen } from '@testing-library/react'

describe('StatusBadge', () => {
  it('renders "Draft" text when status is draft', () => {
    render(<StatusBadge status="draft" />)

    expect(screen.getByText('Draft')).toBeInTheDocument()
  })

  it('renders "Published" text when status is published', () => {
    render(<StatusBadge status="published" />)

    expect(screen.getByText('Published')).toBeInTheDocument()
  })

  it('sets data-status="draft" on the element when status is draft', () => {
    render(<StatusBadge status="draft" />)

    const badge = screen.getByText('Draft').closest('[data-status]')

    expect(badge).toHaveAttribute('data-status', 'draft')
  })

  it('sets data-status="published" on the element when status is published', () => {
    render(<StatusBadge status="published" />)

    const badge = screen.getByText('Published').closest('[data-status]')

    expect(badge).toHaveAttribute('data-status', 'published')
  })

  it('includes a visually-hidden "Status:" prefix for screen readers', () => {
    render(<StatusBadge status="draft" />)

    const prefix = screen.getByText('Status:', { exact: false, selector: '.sr-only' })

    expect(prefix).toBeInTheDocument()
  })
})
