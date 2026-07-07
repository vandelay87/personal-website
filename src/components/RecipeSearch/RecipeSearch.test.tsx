import { render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import RecipeSearch from './RecipeSearch'

const LocationDisplay = () => {
  const location = useLocation()
  return <div data-testid="location">{location.pathname}{location.search}</div>
}

describe('RecipeSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders a search input with aria-label', () => {
    render(<RecipeSearch value="" onSearch={vi.fn()} />)

    const input = screen.getByRole('searchbox', { name: /search recipes/i })
    expect(input).toBeInTheDocument()
  })

  it('calls onSearch callback after 300ms debounce', () => {
    const onSearch = vi.fn()
    render(<RecipeSearch value="" onSearch={onSearch} />)

    const input = screen.getByRole('searchbox', { name: /search recipes/i })
    fireEvent.change(input, { target: { value: 'pizza' } })

    // Advance past debounce period
    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(onSearch).toHaveBeenCalledWith('pizza')
  })

  it('does not call onSearch before debounce period', () => {
    const onSearch = vi.fn()
    render(<RecipeSearch value="" onSearch={onSearch} />)

    const input = screen.getByRole('searchbox', { name: /search recipes/i })
    fireEvent.change(input, { target: { value: 'pasta' } })

    // Advance less than debounce period
    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(onSearch).not.toHaveBeenCalled()
  })
})

describe('RecipeSearch form semantics', () => {
  it('renders the search input inside a form with role="search"', () => {
    render(<RecipeSearch value="" onSearch={vi.fn()} />)

    const form = screen.getByRole('search')
    const input = screen.getByRole('searchbox', { name: /search recipes/i })

    expect(form).toBeInTheDocument()
    expect(form.tagName).toBe('FORM')
    expect(form).toContainElement(input)
  })

  it('does not change the URL when typing in the search box', () => {
    render(
      <MemoryRouter initialEntries={['/recipes']}>
        <RecipeSearch value="" onSearch={vi.fn()} />
        <LocationDisplay />
      </MemoryRouter>
    )

    const input = screen.getByRole('searchbox', { name: /search recipes/i })
    fireEvent.change(input, { target: { value: 'pizza' } })

    expect(screen.getByTestId('location')).toHaveTextContent('/recipes')
    expect(screen.getByTestId('location').textContent).not.toMatch(/[?&](q|query|search)=/)
  })

  it('does not change the URL when the form is submitted', () => {
    render(
      <MemoryRouter initialEntries={['/recipes']}>
        <RecipeSearch value="pasta" onSearch={vi.fn()} />
        <LocationDisplay />
      </MemoryRouter>
    )

    fireEvent.submit(screen.getByRole('search'))

    expect(screen.getByTestId('location')).toHaveTextContent('/recipes')
    expect(screen.getByTestId('location').textContent).not.toMatch(/[?&](q|query|search)=/)
  })
})
