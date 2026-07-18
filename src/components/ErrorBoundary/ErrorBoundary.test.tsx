import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ErrorBoundary from './ErrorBoundary'

const Bomb = ({ message }: { message: string }) => {
  throw new Error(message)
}

describe('ErrorBoundary', () => {
  it('renders children when nothing throws', () => {
    render(
      <ErrorBoundary fallback={() => <p>fallback</p>}>
        <p>content</p>
      </ErrorBoundary>
    )

    expect(screen.getByText('content')).toBeInTheDocument()
    expect(screen.queryByText('fallback')).not.toBeInTheDocument()
  })

  it('renders the fallback with the caught error when a child throws during render', () => {
    // React logs the error to console.error even when a boundary catches it
    vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary fallback={(error) => <p>Caught: {error.message}</p>}>
        <Bomb message="boom" />
      </ErrorBoundary>
    )

    expect(screen.getByText('Caught: boom')).toBeInTheDocument()
  })

  it('calls onError with the error and errorInfo when a child throws', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const onError = vi.fn()

    render(
      <ErrorBoundary fallback={() => <p>fallback</p>} onError={onError}>
        <Bomb message="boom" />
      </ErrorBoundary>
    )

    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error)
    expect(onError.mock.calls[0][0].message).toBe('boom')
    expect(onError.mock.calls[0][1]).toHaveProperty('componentStack')
  })
})
