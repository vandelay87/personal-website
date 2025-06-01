import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import NotFound from './NotFound'

describe('NotFound', () => {
  it('renders the 404 heading', () => {
    render(<NotFound />)
    expect(screen.getByText(/404 - Page Not Found/i)).toBeInTheDocument()
  })

  it('renders the not found message', () => {
    render(<NotFound />)
    expect(
      screen.getByText(/Oops! The page you are looking for does not exist./i)
    ).toBeInTheDocument()
  })
})
