import type { AuthResult, User } from '@models/auth'
import { createContext, useContext } from 'react'

export interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isAdmin: boolean
  loading: boolean
  login: (email: string, password: string) => Promise<AuthResult>
  logout: () => void
  getAccessToken: () => Promise<string>
}

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
