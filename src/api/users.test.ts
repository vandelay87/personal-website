import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchUsers, inviteUser, removeUser } from './users'

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('fetchUsers', () => {
  it('returns user array', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve([
            { email: 'admin@example.com', userId: 'u1', role: 'admin', status: 'active' },
          ]),
      })
    )

    const result = await fetchUsers('token-123')

    expect(result).toEqual([
      { email: 'admin@example.com', userId: 'u1', role: 'admin', status: 'active' },
    ])
  })

  it('sends Authorization header with token', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      })
    )

    await fetchUsers('token-123')

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer token-123',
        }),
      })
    )
  })
})

describe('inviteUser', () => {
  it('calls POST with email and role', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(undefined),
      })
    )

    await inviteUser('token-123', 'new@example.com', 'editor')

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-123',
        }),
        body: JSON.stringify({ email: 'new@example.com', role: 'editor' }),
      })
    )
  })
})

describe('removeUser', () => {
  it('calls DELETE with userId', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(undefined),
      })
    )

    await removeUser('token-123', 'u1')

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('u1'),
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-123',
        }),
      })
    )
  })
})
