import { FullPageHeaderProps } from '@components/FullPageHeader'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Home from './Home'

vi.mock('@components/FullPageHeader', () => ({
  __esModule: true,
  default: ({ name, tagline, description, imageSrc }: FullPageHeaderProps) => (
    <div data-testid="full-page-header">
      <h1>{name}</h1>
      <h2>{tagline}</h2>
      <p>{description}</p>
      <img src={imageSrc} alt={name} />
    </div>
  ),
}))

vi.mock('@components/CVDownload', () => {
  return {
    default: () => <div data-testid="cv-download-mock">CVDownload Component</div>,
  }
})

describe('Home', () => {
  it('renders the FullPageHeader component', () => {
    render(<Home />)
    expect(screen.getByTestId('full-page-header')).toBeInTheDocument()
  })

  it('renders the CVDownload component', () => {
    render(<Home />)
    expect(screen.getByTestId('cv-download-mock')).toBeInTheDocument()
  })

  it('displays the correct name', () => {
    render(<Home />)
    expect(screen.getByText('Akli Aissat')).toBeInTheDocument()
  })

  it('displays the correct tagline', () => {
    render(<Home />)
    expect(screen.getByText('Full-stack engineer')).toBeInTheDocument()
  })

  it('displays the correct description', () => {
    render(<Home />)
    expect(
      screen.getByText(
        /I build beautiful, responsive web applications with React, TypeScript, and modern web technologies/i
      )
    ).toBeInTheDocument()
  })

  it('renders the profile image with correct src and alt', () => {
    render(<Home />)
    const img = screen.getByRole('img', { name: 'Akli Aissat' })
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', expect.stringContaining('profile.webp'))
    expect(img).toHaveAttribute('alt', 'Akli Aissat')
  })
})
