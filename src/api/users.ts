import type { AdminUser } from '@types/auth'

export const fetchUsers = async (_token: string): Promise<AdminUser[]> => {
  throw new Error('Not implemented')
}

export const inviteUser = async (
  _token: string,
  _email: string,
  _role: string
): Promise<void> => {
  throw new Error('Not implemented')
}

export const removeUser = async (_token: string, _userId: string): Promise<void> => {
  throw new Error('Not implemented')
}
