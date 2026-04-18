import { describe, it, expect, vi, beforeEach } from 'vitest'
import { login, completeNewPassword, refreshSession, getCurrentSession, logout } from './auth'

beforeEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('login', () => {
  it('returns tokens on successful authentication', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            accessToken: 'access-123',
            idToken: 'id-123',
            refreshToken: 'refresh-123',
          }),
      })
    )

    const result = await login('user@example.com', 'password123')

    expect(result).toEqual({
      accessToken: 'access-123',
      idToken: 'id-123',
      refreshToken: 'refresh-123',
    })
  })

  it('returns challenge object when NEW_PASSWORD_REQUIRED', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            challengeName: 'NEW_PASSWORD_REQUIRED',
            session: 'session-abc',
          }),
      })
    )

    const result = await login('user@example.com', 'temppass')

    expect(result).toEqual({
      challengeName: 'NEW_PASSWORD_REQUIRED',
      session: 'session-abc',
    })
  })

  it('throws on wrong credentials', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      })
    )

    await expect(login('user@example.com', 'wrong')).rejects.toThrow()
  })
})

describe('completeNewPassword', () => {
  it('returns tokens on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            accessToken: 'access-new',
            idToken: 'id-new',
            refreshToken: 'refresh-new',
          }),
      })
    )

    const result = await completeNewPassword('test@example.com', 'session-abc', 'newPass123!')

    expect(result).toEqual({
      accessToken: 'access-new',
      idToken: 'id-new',
      refreshToken: 'refresh-new',
    })
  })
})

describe('refreshSession', () => {
  it('returns new access and id tokens', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            accessToken: 'access-refreshed',
            idToken: 'id-refreshed',
          }),
      })
    )

    const result = await refreshSession('refresh-123')

    expect(result).toEqual({
      accessToken: 'access-refreshed',
      idToken: 'id-refreshed',
    })
  })
})

describe('getCurrentSession', () => {
  it('returns tokens from localStorage', () => {
    localStorage.setItem('accessToken', 'access-stored')
    localStorage.setItem('refreshToken', 'refresh-stored')
    localStorage.setItem('idToken', 'id-stored')

    const result = getCurrentSession()

    expect(result).toEqual({
      accessToken: 'access-stored',
      refreshToken: 'refresh-stored',
      idToken: 'id-stored',
    })
  })

  it('returns null when no tokens stored', () => {
    const result = getCurrentSession()

    expect(result).toBeNull()
  })
})

describe('logout', () => {
  it('clears localStorage', () => {
    localStorage.setItem('accessToken', 'access-stored')
    localStorage.setItem('refreshToken', 'refresh-stored')
    localStorage.setItem('idToken', 'id-stored')

    logout()

    expect(localStorage.getItem('accessToken')).toBeNull()
    expect(localStorage.getItem('refreshToken')).toBeNull()
    expect(localStorage.getItem('idToken')).toBeNull()
  })
})
