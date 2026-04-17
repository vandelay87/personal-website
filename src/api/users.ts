import type { AdminUser } from '@models/auth'

const API_BASE = import.meta.env.VITE_API_BASE ?? 'https://api.akli.dev'

export const fetchUsers = async (token: string): Promise<AdminUser[]> => {
  const response = await fetch(`${API_BASE}/auth/users`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`)
  }
  return response.json()
}

export const inviteUser = async (
  token: string,
  email: string,
  role: string
): Promise<void> => {
  const response = await fetch(`${API_BASE}/auth/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ email, role }),
  })
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`)
  }
}

export const removeUser = async (token: string, userId: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/auth/users/${userId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`)
  }
}
