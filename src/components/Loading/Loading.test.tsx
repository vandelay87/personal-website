import Loading from '@components/Loading'
import { render, screen } from '@testing-library/react'

describe('Loading', () => {
  it('renders the spinner with correct role and aria attributes', () => {
    render(<Loading />)

    const spinner = screen.getByRole('status', { name: /loading content/i })

    expect(spinner).toBeInTheDocument()
    expect(spinner.tagName).toBe('SPAN')
  })
})
