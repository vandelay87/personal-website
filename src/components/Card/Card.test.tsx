import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Card, { CardProps } from './Card'

describe('Card', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'IntersectionObserver',
      vi.fn((callback) => ({
        observe: vi.fn(() => callback([{ isIntersecting: true }])),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
      }))
    )
  })

  const mockProps: CardProps = {
    title: 'Test Project',
    description: 'This is a test description for the card component.',
    image: { src: '/test-image.jpg', alt: 'Test Project' },
    href: '/projects/test',
  }

  const renderCard = (props = mockProps) =>
    render(
      <MemoryRouter>
        <Card {...props} />
      </MemoryRouter>
    )

  it('renders the title and description correctly', () => {
    renderCard()

    expect(screen.getByText(mockProps.title)).toBeInTheDocument()
    expect(screen.getByText(mockProps.description)).toBeInTheDocument()
  })

  it('renders the image with the correct alt text', () => {
    renderCard()

    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('alt', mockProps.image.alt)
  })

  it('uses image.alt prop for alt text when provided', () => {
    renderCard({
      ...mockProps,
      image: { src: '/test-image.jpg', alt: 'Custom Alt Text' },
    })

    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('alt', 'Custom Alt Text')
  })

  it('renders the link with the correct destination', () => {
    renderCard()

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', mockProps.href)
    expect(link).toHaveTextContent(mockProps.href)
  })
})
