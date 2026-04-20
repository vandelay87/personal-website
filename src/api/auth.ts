import type { AuthResult, AuthTokens } from '@models/auth'

const API_BASE = import.meta.env.VITE_API_BASE ?? 'https://api.akli.dev'

export const login = async (email: string, password: string): Promise<AuthResult> => {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`)
  }
  return response.json()
}

export const completeNewPassword = async (
  email: string,
  session: string,
  newPassword: string
): Promise<AuthTokens> => {
  const response = await fetch(`${API_BASE}/auth/confirm-new-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, session, newPassword }),
  })
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`)
  }
  return response.json()
}

export const refreshSession = async (
  refreshToken: string
): Promise<{ accessToken: string; idToken: string }> => {
  const response = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`)
  }
  return response.json()
}

export const getCurrentSession = (): {
  accessToken: string
  refreshToken: string
  idToken: string
} | null => {
  if (typeof window === 'undefined') return null
  const accessToken = localStorage.getItem('accessToken')
  const refreshToken = localStorage.getItem('refreshToken')
  const idToken = localStorage.getItem('idToken')

  if (!accessToken || !refreshToken || !idToken) {
    return null
  }

  return { accessToken, refreshToken, idToken }
}

export const logout = (): void => {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('idToken')
}

export const isSessionError = (err: unknown): boolean => {
  const message = err instanceof Error ? err.message : ''
  return /session expired|no session|401/i.test(message)
}

export const handleSessionError = (
  err: unknown,
  logout: () => void,
  navigate: (path: string) => void
): boolean => {
  if (!isSessionError(err)) return false
  logout()
  navigate('/admin/login')
  return true
}
