/* eslint-disable @typescript-eslint/ban-ts-comment */
import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import FullPageHeader from './FullPageHeader'

describe('FullPageHeader', () => {
  const DEFAULT_PROPS = {
    name: 'Akli Aissat',
    tagline: 'Frontend Developer',
    description: 'Building beautiful web experiences.',
    imageSrc: '/portrait.jpg',
  }
  const { name, tagline, description, imageSrc } = DEFAULT_PROPS

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders name, tagline, description, image, and button', () => {
    render(<FullPageHeader {...DEFAULT_PROPS} />)
    expect(screen.getByText(name)).toBeInTheDocument()
    expect(screen.getByText(tagline)).toBeInTheDocument()
    expect(screen.getByText(description)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /get in touch/i })).toBeInTheDocument()
    const img = screen.getByAltText(`Portrait of ${name}`) as HTMLImageElement
    expect(img).toBeInTheDocument()
    expect(img.src).toContain(imageSrc)
  })

  it('calls handleSendEmail when "Get in touch" is clicked', () => {
    const originalLocation = window.location
    // @ts-ignore
    delete window.location
    // @ts-ignore
    window.location = { href: '' }

    render(<FullPageHeader {...DEFAULT_PROPS} />)
    const button = screen.getByRole('button', { name: /get in touch/i })
    fireEvent.click(button)
    expect(window.location.href).toContain('mailto:akliaissat@outlook.com?subject=Hello')

    // @ts-ignore
    window.location = originalLocation
  })

  it('applies animation classes after timeout', () => {
    render(<FullPageHeader {...DEFAULT_PROPS} />)
    const heading = screen.getByText(name)
    expect(heading).toHaveClass('opacity-0')
    expect(heading).not.toHaveClass('opacity-100')

    act(() => {
      vi.runAllTimers()
    })

    expect(heading).toHaveClass('opacity-100')
  })

  it('image has correct alt text', () => {
    render(<FullPageHeader {...DEFAULT_PROPS} />)
    const img = screen.getByAltText(`Portrait of ${name}`)
    expect(img).toBeInTheDocument()
  })
})
