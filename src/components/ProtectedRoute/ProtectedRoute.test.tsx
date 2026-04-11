import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { useAuth } from '@contexts/AuthContext'

import ProtectedRoute from './ProtectedRoute'

vi.mock('@contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

const mockedUseAuth = vi.mocked(useAuth)

const LocationDisplay = () => {
  const location = useLocation()
  return <div data-testid="location">{location.pathname}{location.search}</div>
}

const renderProtectedRoute = (initialPath: string, requiredRole?: string) =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute requiredRole={requiredRole}>
              <div>Protected content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/admin/login" element={<div>Login page</div>} />
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
      loading: true,
      login: vi.fn(),
      logout: vi.fn(),
      getAccessToken: vi.fn(),
    })

    renderProtectedRoute('/admin/recipes')

    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
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

    expect(screen.getByText('Protected content')).toBeInTheDocument()
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
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
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
})
