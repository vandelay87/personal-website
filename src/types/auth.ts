export interface AuthTokens {
  accessToken: string
  idToken: string
  refreshToken: string
}

export interface AuthChallenge {
  challengeName: 'NEW_PASSWORD_REQUIRED'
  session: string
}

export type AuthResult = AuthTokens | AuthChallenge

export interface User {
  email: string
  groups: string[]
}

export interface AdminUser {
  email: string
  userId: string
  role: string
  status: string
}
