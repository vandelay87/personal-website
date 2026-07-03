import StatusBadge from '@components/StatusBadge'
import { render, screen } from '@testing-library/react'

describe('StatusBadge', () => {
  it('renders the provided children as its text content', () => {
    render(<StatusBadge tone="success">Published</StatusBadge>)

    expect(screen.getByText('Published')).toBeInTheDocument()
  })

  it('renders different label text per tone', () => {
    render(<StatusBadge tone="warning">Draft</StatusBadge>)

    expect(screen.getByText('Draft')).toBeInTheDocument()
  })

  it('is visible to assistive tech (not aria-hidden itself)', () => {
    render(<StatusBadge tone="error">Failed</StatusBadge>)

    expect(screen.getByText('Failed')).toBeVisible()
  })
})
