import { useAuth } from '@contexts/AuthContext'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'


import ProtectedRoute from './ProtectedRoute'

vi.mock('@contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

const mockedUseAuth = vi.mocked(useAuth)

const LocationDisplay = () => {
  const location = useLocation()
  const state = location.state as { accessDenied?: boolean } | null
  return (
    <div data-testid="location" data-access-denied={state?.accessDenied ? 'true' : 'false'}>
      {location.pathname}
      {location.search}
    </div>
  )
}

const renderProtectedRoute = (initialPath: string, requiredRole?: string) =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/admin/login" element={<div>Login page</div>} />
        <Route
          path="/admin/recipes"
          element={
            <ProtectedRoute>
              <div>Recipes page</div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute requiredRole={requiredRole}>
              <div>Protected content</div>
            </ProtectedRoute>
          }
        />
      </Routes>
      <LocationDisplay />
    </MemoryRouter>
  )

describe('ProtectedRoute', () => {
  it('redirects to /admin/login when unauthenticated', () => {
    mockedUseAuth.mockReturnValue({
      isAuthenticated: false,
      isAdmin: false,
      user: null,
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
      getAccessToken: vi.fn(),
    })

    renderProtectedRoute('/admin/recipes')

    expect(screen.queryByText('Recipes page')).not.toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/admin/login')
  })

  it('preserves redirect URL as query param', () => {
    mockedUseAuth.mockReturnValue({
      isAuthenticated: false,
      isAdmin: false,
      user: null,
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
      getAccessToken: vi.fn(),
    })

    renderProtectedRoute('/admin/users')

    expect(screen.getByTestId('location')).toHaveTextContent(
      '/admin/login?redirect=/admin/users'
    )
  })

  it('renders children when authenticated', () => {
    mockedUseAuth.mockReturnValue({
      isAuthenticated: true,
      isAdmin: false,
      user: { email: 'test@example.com', groups: ['contributor'] },
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
      getAccessToken: vi.fn(),
    })

    renderProtectedRoute('/admin/recipes')

    expect(screen.getByText('Recipes page')).toBeInTheDocument()
  })

  it('shows loading spinner while checking auth', () => {
    mockedUseAuth.mockReturnValue({
      isAuthenticated: false,
      isAdmin: false,
      user: null,
      loading: true,
      login: vi.fn(),
      logout: vi.fn(),
      getAccessToken: vi.fn(),
    })

    renderProtectedRoute('/admin/recipes')

    expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument()
    expect(screen.queryByText('Recipes page')).not.toBeInTheDocument()
  })

  it('redirects non-admin from admin-only route', () => {
    mockedUseAuth.mockReturnValue({
      isAuthenticated: true,
      isAdmin: false,
      user: { email: 'test@example.com', groups: ['contributor'] },
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
      getAccessToken: vi.fn(),
    })

    renderProtectedRoute('/admin/users', 'admin')

    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/admin/recipes')
  })

  it('passes accessDenied state when redirecting a non-admin from an admin-only route', () => {
    mockedUseAuth.mockReturnValue({
      isAuthenticated: true,
      isAdmin: false,
      user: { email: 'test@example.com', groups: ['contributor'] },
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
      getAccessToken: vi.fn(),
    })

    renderProtectedRoute('/admin/users', 'admin')

    expect(screen.getByTestId('location')).toHaveAttribute('data-access-denied', 'true')
  })
})
