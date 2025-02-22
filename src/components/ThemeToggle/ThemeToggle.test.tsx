import ThemeToggle from '@components/ThemeToggle'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'

describe('ThemeToggle Component', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  it('renders the toggle component', () => {
    render(<ThemeToggle />)
    expect(screen.getByLabelText(/dark mode/i)).toBeInTheDocument()
  })

  it('toggles theme from light to dark', () => {
    render(<ThemeToggle />)

    const toggle = screen.getByRole('checkbox')

    expect(toggle).not.toBeChecked()
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')

    fireEvent.click(toggle)

    expect(toggle).toBeChecked()
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(localStorage.getItem('theme')).toBe('dark')
  })

  it('toggles theme from dark to light', () => {
    localStorage.setItem('theme', 'dark')
    document.documentElement.setAttribute('data-theme', 'dark')

    render(<ThemeToggle />)

    const toggle = screen.getByRole('checkbox')

    expect(toggle).toBeChecked()
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')

    fireEvent.click(toggle)

    expect(toggle).not.toBeChecked()
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    expect(localStorage.getItem('theme')).toBe('light')
  })
})
