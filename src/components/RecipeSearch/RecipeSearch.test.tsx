import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import RecipeSearch from './RecipeSearch'

describe('RecipeSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders a search input with aria-label', () => {
    render(<RecipeSearch onSearch={vi.fn()} />)

    const input = screen.getByRole('searchbox', { name: /search recipes/i })
    expect(input).toBeInTheDocument()
  })

  it('calls onSearch callback after 300ms debounce', () => {
    const onSearch = vi.fn()
    render(<RecipeSearch onSearch={onSearch} />)

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
    render(<RecipeSearch onSearch={onSearch} />)

    const input = screen.getByRole('searchbox', { name: /search recipes/i })
    fireEvent.change(input, { target: { value: 'pasta' } })

    // Advance less than debounce period
    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(onSearch).not.toHaveBeenCalled()
  })
})
