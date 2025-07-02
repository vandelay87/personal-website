import { render, screen } from '@testing-library/react'
import FileMeta from './FileMeta'

describe('FileMeta', () => {
  const fileInfo = {
    type: 'PDF',
    date: 'July 2025',
    size: '1.5 KB',
  }

  it('renders file info list when fileInfo is provided', () => {
    render(<FileMeta fileInfo={fileInfo} hasError={false} />)

    // The list container
    const list = screen.getByRole('list')
    expect(list).toBeInTheDocument()

    // List items content
    expect(screen.getByText(/PDF format/i)).toBeInTheDocument()
    expect(screen.getByText(/1.5 KB/i)).toBeInTheDocument()
    expect(screen.getByText(/Updated July 2025/i)).toBeInTheDocument()

    // Check that the bullets are aria-hidden
    const bullets = screen.getAllByText('•')
    bullets.forEach((bullet) => {
      expect(bullet).toHaveAttribute('aria-hidden', 'true')
    })
  })

  it('renders error message when hasError is true and no fileInfo', () => {
    render(<FileMeta fileInfo={null} hasError={true} />)

    expect(screen.getByText(/Failed to load CV metadata/i)).toBeInTheDocument()
  })

  it('renders loading component when no fileInfo and no error', () => {
    render(<FileMeta fileInfo={null} hasError={false} />)
    expect(screen.getByRole('status', { name: /loading content/i })).toBeInTheDocument()
  })
})
