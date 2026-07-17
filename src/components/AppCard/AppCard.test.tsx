import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AppCard, { AppCardProps } from './AppCard'

describe('AppCard', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  const mockProps: AppCardProps = {
    title: 'Test Project',
    description: 'This is a test description for the card component.',
    image: { src: '/test-image.jpg', alt: 'Test Project' },
    href: '/projects/test',
  }

  const renderCard = (props = mockProps) =>
    render(
      <MemoryRouter>
        <AppCard {...props} />
      </MemoryRouter>
    )

  it('renders the title and description correctly', () => {
    renderCard()

    expect(screen.getByText(mockProps.title)).toBeInTheDocument()
    expect(screen.getByText(mockProps.description)).toBeInTheDocument()
  })

  it('renders the image with the correct alt text', () => {
    renderCard()

    const img = screen.getByRole('img', { hidden: true })
    expect(img).toHaveAttribute('alt', mockProps.image.alt)
  })

  it('uses image.alt prop for alt text when provided', () => {
    renderCard({
      ...mockProps,
      image: { src: '/test-image.jpg', alt: 'Custom Alt Text' },
    })

    const img = screen.getByRole('img', { hidden: true })
    expect(img).toHaveAttribute('alt', 'Custom Alt Text')
  })

  it('hides the decorative preview image from assistive tech', () => {
    renderCard()

    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('renders the link with the correct destination', () => {
    renderCard()

    const link = screen.getByRole('link', { name: new RegExp(mockProps.title) })
    expect(link).toHaveAttribute('href', mockProps.href)
  })

  it('makes the whole card a single interactive element', () => {
    renderCard()

    const link = screen.getByRole('link', { name: new RegExp(mockProps.title) })
    expect(within(link).getByRole('img', { hidden: true })).toBeInTheDocument()
    expect(within(link).getByText(mockProps.description)).toBeInTheDocument()
    expect(screen.getAllByRole('link')).toHaveLength(1)
  })

  it('opens external hrefs in a new tab', () => {
    renderCard({ ...mockProps, href: 'https://example.com/apps/test' })

    const link = screen.getByRole('link', { name: new RegExp(mockProps.title) })
    expect(link).toHaveAttribute('href', 'https://example.com/apps/test')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noreferrer')
  })

  it('renders the tag inside the link, accessible (not hidden alongside the decorative image)', () => {
    renderCard({ ...mockProps, tag: 'React · AWS' })

    const link = screen.getByRole('link', { name: new RegExp(mockProps.title) })
    expect(within(link).getByText('React · AWS')).toBeInTheDocument()
  })

  it('renders no tag when the prop is omitted', () => {
    renderCard()

    expect(screen.queryByText('React · AWS')).not.toBeInTheDocument()
  })

  it('renders the arrow once, hidden from assistive tech, next to the title rather than "Open app"', () => {
    renderCard()

    const arrows = screen.getAllByText('↗', { selector: '[aria-hidden="true"]' })
    expect(arrows).toHaveLength(1)

    const title = screen.getByRole('heading', { name: mockProps.title })
    const openApp = screen.getByText('Open app')

    expect(openApp).toHaveTextContent('Open app')
    expect(title.parentElement).toContainElement(arrows[0])
    expect(openApp).not.toContainElement(arrows[0])
  })
})
