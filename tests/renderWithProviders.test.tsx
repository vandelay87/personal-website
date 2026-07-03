import * as authApi from '@api/auth'
import { useAuth } from '@contexts/AuthContext'
import { screen } from '@testing-library/react'
import { useLocation } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { renderWithProviders } from './renderWithProviders'

vi.mock('@api/auth', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  getCurrentSession: vi.fn(),
  refreshSession: vi.fn(),
}))

const LocationDisplay = () => <div data-testid="location">{useLocation().pathname}</div>

const AuthDisplay = () => {
  const { isAuthenticated, isAdmin } = useAuth()
  return <div data-testid="auth">{`${isAuthenticated}/${isAdmin}`}</div>
}

describe('renderWithProviders', () => {
  it('wraps with MemoryRouter using the given initialEntries', () => {
    renderWithProviders(<LocationDisplay />, { initialEntries: ['/admin/recipes'] })

    expect(screen.getByTestId('location')).toHaveTextContent('/admin/recipes')
  })

  it('defaults initialEntries to ["/"] when not provided', () => {
    renderWithProviders(<LocationDisplay />)

    expect(screen.getByTestId('location')).toHaveTextContent('/')
  })

  it('does not provide auth context by default', () => {
    // useAuth() falls back to AuthContext's default value when there's no
    // AuthProvider ancestor, rather than throwing.
    renderWithProviders(<AuthDisplay />)

    expect(screen.getByTestId('auth')).toHaveTextContent('false/false')
  })

  it('wraps with the real AuthProvider when withAuth is true', () => {
    vi.mocked(authApi.getCurrentSession).mockReturnValue(null)

    renderWithProviders(<AuthDisplay />, { withAuth: true })

    expect(screen.getByTestId('auth')).toHaveTextContent('false/false')
  })

  it('renders content with no detectable axe violations', async () => {
    const { container } = renderWithProviders(<LocationDisplay />)

    expect(await axe(container)).toHaveNoViolations()
  })
})
