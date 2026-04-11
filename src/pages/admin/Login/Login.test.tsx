import { completeNewPassword } from '@api/auth'
import { useAuth } from '@contexts/AuthContext'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { AuthChallenge, AuthTokens } from '@types/auth'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Login from './Login'

vi.mock('@contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('@api/auth', () => ({
  completeNewPassword: vi.fn(),
}))

const mockedUseAuth = vi.mocked(useAuth)
const mockedCompleteNewPassword = vi.mocked(completeNewPassword)

const mockTokens: AuthTokens = {
  accessToken: 'access-token',
  idToken: 'id-token',
  refreshToken: 'refresh-token',
}

const mockChallenge: AuthChallenge = {
  challengeName: 'NEW_PASSWORD_REQUIRED',
  session: 'sess-123',
}

const LocationDisplay = () => {
  const location = useLocation()
  return (
    <div data-testid="location">
      {location.pathname}
      {location.search}
    </div>
  )
}

const renderLogin = (initialPath = '/admin/login') => {
  const mockLogin = vi.fn()

  mockedUseAuth.mockReturnValue({
    user: null,
    isAuthenticated: false,
    isAdmin: false,
    loading: false,
    login: mockLogin,
    logout: vi.fn(),
    getAccessToken: vi.fn(),
  })

  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin/recipes" element={<div>Recipes page</div>} />
        <Route path="/admin/users" element={<div>Users page</div>} />
      </Routes>
      <LocationDisplay />
    </MemoryRouter>
  )

  return { mockLogin }
}

const fillAndSubmitLoginForm = (
  email: string,
  password: string
) => {
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: email } })
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: password } })
  fireEvent.click(screen.getByRole('button', { name: /log in/i }))
}

describe('Login page', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('renders login form with email input, password input, and submit button', () => {
    renderLogin()

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument()
  })

  it('redirects to /admin/recipes on successful login', async () => {
    const { mockLogin } = renderLogin()
    mockLogin.mockResolvedValue(mockTokens)

    fillAndSubmitLoginForm('admin@example.com', 'password123')

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/admin/recipes')
    })
  })

  it('redirects to original URL from ?redirect param on successful login', async () => {
    const { mockLogin } = renderLogin('/admin/login?redirect=/admin/users')
    mockLogin.mockResolvedValue(mockTokens)

    fillAndSubmitLoginForm('admin@example.com', 'password123')

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/admin/users')
    })
  })

  it('shows error message for invalid credentials', async () => {
    const { mockLogin } = renderLogin()
    mockLogin.mockRejectedValue(new Error('401 Unauthorized'))

    fillAndSubmitLoginForm('wrong@example.com', 'wrongpass')

    await waitFor(() => {
      expect(screen.getByText('Incorrect email or password')).toBeInTheDocument()
    })

    const errorMessage = screen.getByText('Incorrect email or password')
    expect(errorMessage).toHaveAttribute('id')
  })

  it('disables submit button while loading', async () => {
    const { mockLogin } = renderLogin()
    mockLogin.mockReturnValue(new Promise(() => {}))

    fillAndSubmitLoginForm('admin@example.com', 'password123')

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /log in/i })).toBeDisabled()
    })
  })

  it('shows new password form on NEW_PASSWORD_REQUIRED challenge', async () => {
    const { mockLogin } = renderLogin()
    mockLogin.mockResolvedValue(mockChallenge)

    fillAndSubmitLoginForm('admin@example.com', 'temppass')

    await waitFor(() => {
      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument()
    })
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /set new password/i })).toBeInTheDocument()
  })

  it('shows error when new passwords do not match', async () => {
    const { mockLogin } = renderLogin()
    mockLogin.mockResolvedValue(mockChallenge)

    fillAndSubmitLoginForm('admin@example.com', 'temppass')

    await waitFor(() => {
      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: 'NewPass123!' } })
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'DifferentPass456!' },
    })
    fireEvent.click(screen.getByRole('button', { name: /set new password/i }))

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
    })
  })

  it('redirects after successful new password completion', async () => {
    const { mockLogin } = renderLogin()
    mockLogin.mockResolvedValue(mockChallenge)
    mockedCompleteNewPassword.mockResolvedValue(mockTokens)

    fillAndSubmitLoginForm('admin@example.com', 'temppass')

    await waitFor(() => {
      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: 'NewPass123!' } })
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'NewPass123!' },
    })
    fireEvent.click(screen.getByRole('button', { name: /set new password/i }))

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/admin/recipes')
    })
  })

  it('shows generic error message on network error', async () => {
    const { mockLogin } = renderLogin()
    mockLogin.mockRejectedValue(new TypeError('Failed to fetch'))

    fillAndSubmitLoginForm('admin@example.com', 'password123')

    await waitFor(() => {
      expect(
        screen.getByText('Something went wrong. Please try again.')
      ).toBeInTheDocument()
    })
  })

  it('has associated label elements for email and password inputs', () => {
    renderLogin()

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)

    expect(emailInput.tagName).toBe('INPUT')
    expect(passwordInput.tagName).toBe('INPUT')
    expect(emailInput).toHaveAttribute('type', 'email')
    expect(passwordInput).toHaveAttribute('type', 'password')
  })
})
