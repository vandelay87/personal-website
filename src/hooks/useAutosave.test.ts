import * as authApi from '@api/auth'
import * as authContext from '@contexts/AuthContext'
import { act, configure, renderHook, waitFor } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'


import { useAutosave } from './useAutosave'

vi.mock('@api/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@api/auth')>()
  return {
    ...actual,
    handleSessionError: vi.fn(),
  }
})

// Mock useNavigate so the hook can resolve it without a router.
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

const navigateMock = vi.fn()
const logoutMock = vi.fn()

// Stub useAuth so the hook can pull logout without a full AuthProvider.
const useAuthSpy = vi.spyOn(authContext, 'useAuth')

type Draft = {
  dirty: boolean
  title: string
  body?: string
}

beforeEach(() => {
  navigateMock.mockReset()
  logoutMock.mockReset()
  vi.mocked(authApi.handleSessionError).mockReset()
  useAuthSpy.mockReturnValue({
    user: null,
    isAuthenticated: true,
    isAdmin: true,
    loading: false,
    login: vi.fn(),
    logout: logoutMock,
    getAccessToken: vi.fn(),
  })
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('useAutosave — state machine', () => {
  beforeAll(() => {
    configure({ asyncUtilTimeout: 5000 })
  })

  afterAll(() => {
    configure({ asyncUtilTimeout: 1000 })
  })

  it('status is idle on first render', () => {
    const saveFn = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() =>
      useAutosave<Draft>({ dirty: false, title: '' }, saveFn)
    )

    expect(result.current.status).toBe('idle')
    expect(result.current.lastSavedAt).toBeNull()
  })

  it('transitions idle → saving → saved after a dirty change and sets lastSavedAt', async () => {
    let resolveSave!: () => void
    const saveFn = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSave = resolve
        })
    )

    const initial: Draft = { dirty: false, title: '' }
    const { result, rerender } = renderHook(
      ({ state }: { state: Draft }) => useAutosave<Draft>(state, saveFn),
      { initialProps: { state: initial } }
    )

    expect(result.current.status).toBe('idle')

    rerender({ state: { dirty: true, title: 'Hello' } })

    await waitFor(() => {
      expect(result.current.status).toBe('saving')
    })

    await act(async () => {
      resolveSave()
    })

    await waitFor(() => {
      expect(result.current.status).toBe('saved')
    })
    expect(result.current.lastSavedAt).toBeInstanceOf(Date)
  })

  it('transitions to error when saveFn rejects with a non-session error and does not update lastSavedAt', async () => {
    const saveFn = vi.fn().mockRejectedValue(new Error('Network down'))

    const { result, rerender } = renderHook(
      ({ state }: { state: Draft }) => useAutosave<Draft>(state, saveFn),
      { initialProps: { state: { dirty: false, title: '' } as Draft } }
    )

    rerender({ state: { dirty: true, title: 'Hello' } as Draft })

    await waitFor(() => {
      expect(result.current.status).toBe('error')
    })
    expect(result.current.lastSavedAt).toBeNull()
  })

  it('retry re-invokes saveFn and transitions saving → saved on success', async () => {
    const saveFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('Network down'))
      .mockResolvedValueOnce(undefined)

    const { result, rerender } = renderHook(
      ({ state }: { state: Draft }) => useAutosave<Draft>(state, saveFn),
      { initialProps: { state: { dirty: false, title: '' } as Draft } }
    )

    rerender({ state: { dirty: true, title: 'Hello' } as Draft })

    await waitFor(() => {
      expect(result.current.status).toBe('error')
    })

    act(() => {
      result.current.retry()
    })

    await waitFor(() => {
      expect(result.current.status).toBe('saved')
    })
    expect(saveFn).toHaveBeenCalledTimes(2)
  })

  it('aborts an in-flight save when a newer fire starts (previous AbortSignal is aborted)', async () => {
    const calls: Array<{ state: Draft; signal: AbortSignal; resolve: () => void }> = []
    const saveFn = vi.fn((state: Draft, signal: AbortSignal) => {
      return new Promise<void>((resolve) => {
        calls.push({ state, signal, resolve })
      })
    })

    const { result, rerender } = renderHook(
      ({ state }: { state: Draft }) => useAutosave<Draft>(state, saveFn),
      { initialProps: { state: { dirty: false, title: '' } as Draft } }
    )

    rerender({ state: { dirty: true, title: 'First' } as Draft })

    await waitFor(() => {
      expect(calls.length).toBe(1)
    })

    // A newer dirty change while the first is still in flight.
    rerender({ state: { dirty: true, title: 'Second' } as Draft })

    await waitFor(() => {
      expect(calls.length).toBe(2)
    })

    // The first signal should now be aborted.
    expect(calls[0].signal.aborted).toBe(true)
    expect(calls[1].signal.aborted).toBe(false)

    // Resolve both in reverse order; only the latest result updates lastSavedAt.
    await act(async () => {
      calls[0].resolve()
      calls[1].resolve()
    })

    await waitFor(() => {
      expect(result.current.status).toBe('saved')
    })
    expect(result.current.lastSavedAt).toBeInstanceOf(Date)
  })

  it('skips saveFn when dirty is false', () => {
    const saveFn = vi.fn().mockResolvedValue(undefined)

    const { rerender } = renderHook(
      ({ state }: { state: Draft }) => useAutosave<Draft>(state, saveFn),
      { initialProps: { state: { dirty: false, title: 'A' } as Draft } }
    )

    rerender({ state: { dirty: false, title: 'B' } as Draft })
    rerender({ state: { dirty: false, title: 'C' } as Draft })

    expect(saveFn).not.toHaveBeenCalled()
  })

  it('skips saveFn when state is dirty but matches the last-saved snapshot', async () => {
    const saveFn = vi.fn().mockResolvedValue(undefined)

    const snapshot: Draft = { dirty: true, title: 'Hello', body: 'World' }
    const { result, rerender } = renderHook(
      ({ state }: { state: Draft }) => useAutosave<Draft>(state, saveFn),
      { initialProps: { state: { dirty: false, title: 'Hello', body: 'World' } as Draft } }
    )

    // First dirty fire — saves.
    rerender({ state: snapshot })
    await waitFor(() => {
      expect(result.current.status).toBe('saved')
    })
    expect(saveFn).toHaveBeenCalledTimes(1)

    // Dispatch the same values again as "dirty". Nothing changed against
    // the last-saved snapshot, so the hook should skip.
    rerender({ state: { dirty: true, title: 'Hello', body: 'World' } as Draft })

    // Give the hook a turn to react without triggering a fresh save.
    await Promise.resolve()
    await Promise.resolve()

    expect(saveFn).toHaveBeenCalledTimes(1)
  })
})

describe('useAutosave — debounce timing + lifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not call saveFn at t=1999ms but does at t=2000ms after a dirty change', async () => {
    const saveFn = vi.fn().mockResolvedValue(undefined)

    const { rerender } = renderHook(
      ({ state }: { state: Draft }) => useAutosave<Draft>(state, saveFn),
      { initialProps: { state: { dirty: false, title: '' } as Draft } }
    )

    rerender({ state: { dirty: true, title: 'Hello' } as Draft })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1999)
    })
    expect(saveFn).not.toHaveBeenCalled()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })
    expect(saveFn).toHaveBeenCalledTimes(1)
  })

  it('collapses multiple dirty changes within the debounce window into a single trailing call', async () => {
    const saveFn = vi.fn().mockResolvedValue(undefined)

    const { rerender } = renderHook(
      ({ state }: { state: Draft }) => useAutosave<Draft>(state, saveFn),
      { initialProps: { state: { dirty: false, title: '' } as Draft } }
    )

    rerender({ state: { dirty: true, title: 'One' } as Draft })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500)
    })
    rerender({ state: { dirty: true, title: 'Two' } as Draft })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500)
    })
    rerender({ state: { dirty: true, title: 'Three' } as Draft })

    // Advance to 2s after the last change.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000)
    })

    expect(saveFn).toHaveBeenCalledTimes(1)
  })

  it('fires with the latest state snapshot (stale-closure guard)', async () => {
    const saveFn = vi.fn().mockResolvedValue(undefined)

    const { rerender } = renderHook(
      ({ state }: { state: Draft }) => useAutosave<Draft>(state, saveFn),
      { initialProps: { state: { dirty: false, title: '' } as Draft } }
    )

    rerender({ state: { dirty: true, title: 'Early' } as Draft })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500)
    })
    rerender({ state: { dirty: true, title: 'Latest' } as Draft })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000)
    })

    expect(saveFn).toHaveBeenCalledTimes(1)
    const [payload] = saveFn.mock.calls[0]
    expect(payload.title).toBe('Latest')
  })

  it('flushes the pending save immediately on visibilitychange → hidden', async () => {
    const saveFn = vi.fn().mockResolvedValue(undefined)

    const { rerender } = renderHook(
      ({ state }: { state: Draft }) => useAutosave<Draft>(state, saveFn),
      { initialProps: { state: { dirty: false, title: '' } as Draft } }
    )

    rerender({ state: { dirty: true, title: 'Hello' } as Draft })

    // Debounce has not elapsed yet.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100)
    })
    expect(saveFn).not.toHaveBeenCalled()

    try {
      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        configurable: true,
      })
      await act(async () => {
        document.dispatchEvent(new Event('visibilitychange'))
      })

      expect(saveFn).toHaveBeenCalledTimes(1)
    } finally {
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        configurable: true,
      })
    }
  })

  it('flushes the pending save on unmount', async () => {
    const saveFn = vi.fn().mockResolvedValue(undefined)

    const { rerender, unmount } = renderHook(
      ({ state }: { state: Draft }) => useAutosave<Draft>(state, saveFn),
      { initialProps: { state: { dirty: false, title: '' } as Draft } }
    )

    rerender({ state: { dirty: true, title: 'Hello' } as Draft })

    // Unmount before the debounce fires.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100)
    })
    expect(saveFn).not.toHaveBeenCalled()

    unmount()

    expect(saveFn).toHaveBeenCalledTimes(1)
  })
})

describe('useAutosave — 401 handling', () => {
  beforeAll(() => {
    configure({ asyncUtilTimeout: 5000 })
  })

  afterAll(() => {
    configure({ asyncUtilTimeout: 1000 })
  })

  it('invokes handleSessionError with (err, logout, navigate) when saveFn rejects with a 401', async () => {
    const authErr = new Error('401 Unauthorized')
    const saveFn = vi.fn().mockRejectedValue(authErr)

    const { rerender } = renderHook(
      ({ state }: { state: Draft }) => useAutosave<Draft>(state, saveFn),
      { initialProps: { state: { dirty: false, title: '' } as Draft } }
    )

    rerender({ state: { dirty: true, title: 'Hello' } as Draft })

    await waitFor(() => {
      expect(vi.mocked(authApi.handleSessionError)).toHaveBeenCalled()
    })

    const [errArg, logoutArg, navigateArg] = vi.mocked(authApi.handleSessionError).mock.calls[0]
    expect(errArg).toBe(authErr)
    expect(logoutArg).toBe(logoutMock)
    expect(navigateArg).toBe(navigateMock)
  })
})
