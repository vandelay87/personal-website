import * as authApi from '@api/auth'
import type { AuthResult, AuthTokens, User } from '@models/auth'
import { createContext, useContext, useState, type FC, type ReactNode } from 'react'

export interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isAdmin: boolean
  loading: boolean
  login: (email: string, password: string) => Promise<AuthResult>
  logout: () => void
  getAccessToken: () => Promise<string>
}

const decodeIdToken = (idToken: string): User => {
  try {
    const parts = idToken.split('.')
    if (parts.length !== 3) return null
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    const payload = JSON.parse(atob(padded))
    return {
      email: payload.email ?? '',
      groups: payload['cognito:groups'] ?? [],
    }
  } catch {
    return null
  }
}

const isTokenResult = (result: AuthResult): result is AuthTokens =>
  'accessToken' in result

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAuthenticated: false,
  isAdmin: false,
  loading: true,
  login: async () => {
    throw new Error('Not implemented')
  },
  logout: () => {},
  getAccessToken: async () => {
    throw new Error('Not implemented')
  },
})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const initSession = (): { user: User | null; isAuthenticated: boolean } => {
    const session = authApi.getCurrentSession()
    if (!session) {
      return { user: null, isAuthenticated: false }
    }
    const user = decodeIdToken(session.idToken)
    if (!user) {
      authApi.logout()
      return { user: null, isAuthenticated: false }
    }
    return { user, isAuthenticated: true }
  }

  const initial = initSession()
  const [user, setUser] = useState<User | null>(initial.user)
  const [isAuthenticated, setIsAuthenticated] = useState(initial.isAuthenticated)
  const [loading] = useState(false)

  const isAdmin = user?.groups.includes('admin') ?? false

  const login = async (email: string, password: string): Promise<AuthResult> => {
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
  }

  const logout = (): void => {
    authApi.logout()
    setUser(null)
    setIsAuthenticated(false)
  }

  const isTokenExpired = (token: string): boolean => {
    try {
      const parts = token.split('.')
      if (parts.length !== 3) return true
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
      const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
      const payload = JSON.parse(atob(padded))
      return !payload.exp || payload.exp * 1000 < Date.now()
    } catch {
      return true
    }
  }

  const getAccessToken = async (): Promise<string> => {
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
  }

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, isAdmin, loading, login, logout, getAccessToken }}
    >
      {children}
    </AuthContext.Provider>
  )
}
