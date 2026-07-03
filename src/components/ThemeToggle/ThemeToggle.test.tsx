import ThemeToggle from '@components/ThemeToggle'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  it('renders a round icon button with an accessible label describing the switch action', () => {
    render(<ThemeToggle />)

    expect(
      screen.getByRole('button', { name: /switch to (dark|light) mode/i })
    ).toBeInTheDocument()
  })

  it('labels the button "Switch to dark mode" when the current theme is light', () => {
    document.documentElement.setAttribute('data-theme', 'light')

    render(<ThemeToggle />)

    expect(screen.getByRole('button', { name: 'Switch to dark mode' })).toBeInTheDocument()
  })

  it('reflects the theme already set on the document root on initial render (no hydration mismatch)', () => {
    // Simulates the blocking no-flash script having already set data-theme
    // before React mounts. The toggle must reflect that on first render,
    // not default to assuming light.
    document.documentElement.setAttribute('data-theme', 'dark')

    render(<ThemeToggle />)

    expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument()
  })

  it('flips data-theme on the document root and updates its label when clicked', () => {
    document.documentElement.setAttribute('data-theme', 'light')

    render(<ThemeToggle />)

    fireEvent.click(screen.getByRole('button', { name: 'Switch to dark mode' }))

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Switch to light mode' }))

    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    expect(screen.getByRole('button', { name: 'Switch to dark mode' })).toBeInTheDocument()
  })

  it('persists the new theme to the existing "theme" localStorage key (kept, not renamed)', () => {
    document.documentElement.setAttribute('data-theme', 'light')

    render(<ThemeToggle />)

    fireEvent.click(screen.getByRole('button', { name: 'Switch to dark mode' }))

    expect(localStorage.getItem('theme')).toBe('dark')
    // The design reference's `akli-theme` key is an explicit non-adoption per the PRD.
    expect(localStorage.getItem('akli-theme')).toBeNull()
  })
})
