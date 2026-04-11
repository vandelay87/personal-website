import { createContext, useContext, type FC, type ReactNode } from 'react'
import type { AuthResult, User } from '@types/auth'

export interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isAdmin: boolean
  login: (email: string, password: string) => Promise<AuthResult>
  logout: () => void
  getAccessToken: () => Promise<string>
}

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
  return (
    <AuthContext.Provider
      value={{
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
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
