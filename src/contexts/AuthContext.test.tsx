import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'

vi.mock('@api/auth', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  getCurrentSession: vi.fn(),
  refreshSession: vi.fn(),
}))

import * as authApi from '@api/auth'

const TestConsumer = () => {
  const { user, isAuthenticated, isAdmin, login, logout, getAccessToken } = useAuth()
  return (
    <div>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <span data-testid="admin">{String(isAdmin)}</span>
      <span data-testid="user">{user ? user.email : 'none'}</span>
      <button onClick={() => login('user@example.com', 'pass123')}>Login</button>
      <button onClick={logout}>Logout</button>
      <button onClick={() => getAccessToken().then((t) => console.log(t))}>GetToken</button>
    </div>
  )
}

beforeEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('AuthProvider', () => {
  it('provides isAuthenticated: false when no session exists', () => {
    vi.mocked(authApi.getCurrentSession).mockReturnValue(null)

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
    expect(screen.getByTestId('user')).toHaveTextContent('none')
  })

  it('after calling login, isAuthenticated becomes true and user is populated', async () => {
    vi.mocked(authApi.getCurrentSession).mockReturnValue(null)
    vi.mocked(authApi.login).mockResolvedValue({
      accessToken: 'access-123',
      idToken: 'id-123',
      refreshToken: 'refresh-123',
    })

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await act(async () => {
      screen.getByText('Login').click()
    })

    expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
    expect(screen.getByTestId('user')).not.toHaveTextContent('none')
  })

  it('after logout, isAuthenticated becomes false and user is null', async () => {
    vi.mocked(authApi.getCurrentSession).mockReturnValue({
      accessToken: 'access-123',
      refreshToken: 'refresh-123',
      idToken: 'id-123',
    })

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await act(async () => {
      screen.getByText('Logout').click()
    })

    expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
    expect(screen.getByTestId('user')).toHaveTextContent('none')
  })

  it('isAdmin is true when user groups include admin', async () => {
    vi.mocked(authApi.getCurrentSession).mockReturnValue(null)
    vi.mocked(authApi.login).mockResolvedValue({
      accessToken: 'access-admin',
      idToken: 'id-admin',
      refreshToken: 'refresh-admin',
    })

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    // The idToken should contain admin group info — after login the provider
    // should decode it and set isAdmin accordingly
    await act(async () => {
      screen.getByText('Login').click()
    })

    expect(screen.getByTestId('admin')).toHaveTextContent('true')
  })

  it('on mount with existing localStorage tokens, auto-restores session', () => {
    vi.mocked(authApi.getCurrentSession).mockReturnValue({
      accessToken: 'access-stored',
      refreshToken: 'refresh-stored',
      idToken: 'id-stored',
    })

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
  })

  it('getAccessToken returns the current access token', async () => {
    vi.mocked(authApi.getCurrentSession).mockReturnValue({
      accessToken: 'access-current',
      refreshToken: 'refresh-current',
      idToken: 'id-current',
    })

    let token: string | undefined
    const TokenConsumer = () => {
      const { getAccessToken } = useAuth()
      return (
        <button
          onClick={async () => {
            token = await getAccessToken()
          }}
        >
          Get Token
        </button>
      )
    }

    render(
      <AuthProvider>
        <TokenConsumer />
      </AuthProvider>
    )

    await act(async () => {
      screen.getByText('Get Token').click()
    })

    expect(token).toBe('access-current')
  })
})
