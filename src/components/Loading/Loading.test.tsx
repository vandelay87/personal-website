import Loading from '@components/Loading'
import { render, screen } from '@testing-library/react'

describe('Loading', () => {
  it('renders the spinner with correct role and aria attributes', () => {
    render(<Loading />)

    const spinner = screen.getByRole('status', { name: /loading content/i })

    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveClass(
      'inline-block',
      'w-[1em]',
      'h-[1em]',
      'align-middle',
      'animate-spin',
      'rounded-full',
      'border-[0.15em]',
      'border-gray-400',
      'border-t-transparent',
      'dark:border-gray-500',
      'dark:border-t-transparent'
    )
  })
})
