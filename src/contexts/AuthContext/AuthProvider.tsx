import * as authApi from '@api/auth'
import type { AuthResult, AuthTokens, User } from '@models/auth'
import { useCallback, useEffect, useMemo, useState, type FC, type ReactNode } from 'react'
import { AuthContext } from './context'

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    return JSON.parse(atob(padded))
  } catch {
    return null
  }
}

const decodeIdToken = (idToken: string): User | null => {
  const payload = decodeJwtPayload(idToken)
  if (!payload) return null
  return {
    email: (payload.email as string) ?? '',
    groups: (payload['cognito:groups'] as string[]) ?? [],
  }
}

const isTokenResult = (result: AuthResult): result is AuthTokens =>
  'accessToken' in result

const isTokenExpired = (token: string): boolean => {
  const payload = decodeJwtPayload(token)
  const exp = payload?.exp as number | undefined
  return !exp || exp * 1000 < Date.now()
}

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  // Start loading so server and client first render match (server can't access
  // localStorage). A post-mount effect resolves the real session.
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const session = authApi.getCurrentSession()
    if (session) {
      const decoded = decodeIdToken(session.idToken)
      if (decoded) {
        // A lazy useState initializer can't replace this: it would read
        // localStorage during the client's hydration render itself and
        // mismatch the server-rendered (always logged-out) markup — this
        // has to resolve after hydration completes, not during it.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUser(decoded)
        setIsAuthenticated(true)
      } else {
        authApi.logout()
      }
    }
    setLoading(false)
  }, [])

  const isAdmin = user?.groups.includes('admin') ?? false

  const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const result = await authApi.login(email, password)

    if (isTokenResult(result)) {
      localStorage.setItem('accessToken', result.accessToken)
      localStorage.setItem('idToken', result.idToken)
      localStorage.setItem('refreshToken', result.refreshToken)

      const decoded = decodeIdToken(result.idToken)
      if (decoded) {
        setUser(decoded)
        setIsAuthenticated(true)
      }
    }

    return result
  }, [])

  const logout = useCallback((): void => {
    authApi.logout()
    setUser(null)
    setIsAuthenticated(false)
  }, [])

  const getAccessToken = useCallback(async (): Promise<string> => {
    const session = authApi.getCurrentSession()
    if (!session) {
      throw new Error('No session')
    }

    if (!isTokenExpired(session.accessToken)) {
      return session.accessToken
    }

    try {
      const refreshed = await authApi.refreshSession(session.refreshToken)
      localStorage.setItem('accessToken', refreshed.accessToken)
      localStorage.setItem('idToken', refreshed.idToken)

      const decoded = decodeIdToken(refreshed.idToken)
      if (decoded) {
        setUser(decoded)
      }

      return refreshed.accessToken
    } catch {
      throw new Error('Session expired')
    }
  }, [])

  const value = useMemo(
    () => ({ user, isAuthenticated, isAdmin, loading, login, logout, getAccessToken }),
    [user, isAuthenticated, isAdmin, loading, login, logout, getAccessToken]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
