import Link from '@components/Link'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

describe('Link', () => {
  it('renders correctly with children', () => {
    render(
      <MemoryRouter>
        <Link to="/about">About</Link>
      </MemoryRouter>
    )

    const linkElement = screen.getByRole('link', { name: /about/i })

    expect(linkElement).toBeInTheDocument()
    expect(linkElement).toHaveTextContent('About')
  })

  it('points to the correct destination', () => {
    render(
      <MemoryRouter>
        <Link to="/apps">Apps</Link>
      </MemoryRouter>
    )

    const linkElement = screen.getByRole('link', { name: /apps/i })

    expect(linkElement).toHaveAttribute('href', '/apps')
  })

  it('renders as an external anchor tag when "to" is a URL', () => {
    const externalUrl = 'https://google.com'
    render(
      <MemoryRouter>
        <Link to={externalUrl}>External Site</Link>
      </MemoryRouter>
    )

    const linkElement = screen.getByRole('link', { name: /external site/i })

    expect(linkElement).toHaveAttribute('href', externalUrl)
    expect(linkElement).toHaveAttribute('target', '_blank')
    expect(linkElement).toHaveAttribute('rel', 'noreferrer')
  })
})
