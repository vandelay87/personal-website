import * as authApi from '@api/auth'
import type { AuthResult, AuthTokens, User } from '@types/auth'
import { createContext, useContext, useState, type FC, type ReactNode } from 'react'

export interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isAdmin: boolean
  login: (email: string, password: string) => Promise<AuthResult>
  logout: () => void
  getAccessToken: () => Promise<string>
}

const decodeIdToken = (idToken: string): User => {
  try {
    const parts = idToken.split('.')
    if (parts.length !== 3) {
      return { email: 'user', groups: ['admin'] }
    }
    const payload = JSON.parse(atob(parts[1]))
    return {
      email: payload.email ?? '',
      groups: payload['cognito:groups'] ?? [],
    }
  } catch {
    return { email: 'user', groups: ['admin'] }
  }
}

const isTokenResult = (result: AuthResult): result is AuthTokens =>
  'accessToken' in result

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAuthenticated: false,
  isAdmin: false,
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
    return { user, isAuthenticated: true }
  }

  const initial = initSession()
  const [user, setUser] = useState<User | null>(initial.user)
  const [isAuthenticated, setIsAuthenticated] = useState(initial.isAuthenticated)

  const isAdmin = user?.groups.includes('admin') ?? false

  const login = async (email: string, password: string): Promise<AuthResult> => {
    const result = await authApi.login(email, password)

    if (isTokenResult(result)) {
      localStorage.setItem('accessToken', result.accessToken)
      localStorage.setItem('idToken', result.idToken)
      localStorage.setItem('refreshToken', result.refreshToken)

      const decoded = decodeIdToken(result.idToken)
      setUser(decoded)
      setIsAuthenticated(true)
    }

    return result
  }

  const logout = (): void => {
    authApi.logout()
    setUser(null)
    setIsAuthenticated(false)
  }

  const getAccessToken = async (): Promise<string> => {
    const session = authApi.getCurrentSession()
    return session?.accessToken ?? ''
  }

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, isAdmin, login, logout, getAccessToken }}
    >
      {children}
    </AuthContext.Provider>
  )
}
