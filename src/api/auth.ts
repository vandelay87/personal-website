import type { AuthResult, AuthTokens } from '@types/auth'

export const login = async (_email: string, _password: string): Promise<AuthResult> => {
  throw new Error('Not implemented')
}

export const completeNewPassword = async (
  _session: string,
  _newPassword: string
): Promise<AuthTokens> => {
  throw new Error('Not implemented')
}

export const logout = (): void => {
  throw new Error('Not implemented')
}

export const refreshSession = async (
  _refreshToken: string
): Promise<{ accessToken: string; idToken: string }> => {
  throw new Error('Not implemented')
}

export const getCurrentSession = (): {
  accessToken: string
  refreshToken: string
  idToken: string
} | null => {
  throw new Error('Not implemented')
}
