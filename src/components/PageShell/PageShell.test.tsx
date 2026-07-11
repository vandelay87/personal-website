import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import PageShell from './PageShell'

describe('PageShell', () => {
  it('renders header, main content, and footer in order', () => {
    render(
      <PageShell header={<div>Header content</div>} footer={<div>Footer content</div>}>
        <p>Main content</p>
      </PageShell>
    )

    expect(screen.getByText('Header content')).toBeInTheDocument()
    expect(screen.getByText('Main content')).toBeInTheDocument()
    expect(screen.getByText('Footer content')).toBeInTheDocument()
  })

  it('renders a skip link targeting the main landmark', () => {
    render(
      <PageShell header={<div>Header</div>} footer={<div>Footer</div>}>
        <p>Content</p>
      </PageShell>
    )

    expect(screen.getByRole('link', { name: /skip to main content/i })).toHaveAttribute('href', '#main')
  })

  it('renders children inside a focusable main landmark with id "main"', () => {
    render(
      <PageShell header={<div>Header</div>} footer={<div>Footer</div>}>
        <p>Content</p>
      </PageShell>
    )

    const main = screen.getByRole('main')
    expect(main).toHaveAttribute('id', 'main')
    expect(main).toHaveAttribute('tabIndex', '-1')
  })

  it('applies mainClassName to the main landmark when provided', () => {
    render(
      <PageShell header={<div>Header</div>} footer={<div>Footer</div>} mainClassName="custom-main">
        <p>Content</p>
      </PageShell>
    )

    expect(screen.getByRole('main')).toHaveClass('custom-main')
  })
})
