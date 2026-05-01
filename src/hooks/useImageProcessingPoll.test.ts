import * as authApi from '@api/auth'
import * as recipesApi from '@api/recipes'
import * as authContext from '@contexts/AuthContext'
import type { Recipe } from '@models/recipe'
import { act, configure, renderHook, waitFor } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'


import { useImageProcessingPoll } from './useImageProcessingPoll'

vi.mock('@api/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@api/auth')>()
  return {
    ...actual,
    handleSessionError: vi.fn(),
  }
})

vi.mock('@api/recipes', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@api/recipes')>()
  return {
    ...actual,
    fetchRecipeByIdAdmin: vi.fn(),
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
const getAccessTokenMock = vi.fn<() => Promise<string>>()

// Stub useAuth so the hook can pull logout / getAccessToken without a full AuthProvider.
const useAuthSpy = vi.spyOn(authContext, 'useAuth')

const fetchMock = vi.mocked(recipesApi.fetchRecipeByIdAdmin)

const makeRecipe = (overrides: Partial<Recipe> = {}): Recipe => ({
  id: 'r1',
  title: 'Test Recipe',
  slug: 'test-recipe',
  coverImage: { key: 'recipes/r1/cover', alt: 'cover' },
  tags: [],
  prepTime: 10,
  cookTime: 20,
  servings: 2,
  createdAt: '2026-01-01T00:00:00.000Z',
  intro: '',
  ingredients: [],
  steps: [],
  authorId: 'author-1',
  authorName: 'Admin',
  updatedAt: '2026-01-01T00:00:00.000Z',
  status: 'draft',
  ...overrides,
})

beforeEach(() => {
  navigateMock.mockReset()
  logoutMock.mockReset()
  getAccessTokenMock.mockReset()
  getAccessTokenMock.mockResolvedValue('token-123')
  fetchMock.mockReset()
  vi.mocked(authApi.handleSessionError).mockReset()
  useAuthSpy.mockReturnValue({
    user: null,
    isAuthenticated: true,
    isAdmin: true,
    loading: false,
    login: vi.fn(),
    logout: logoutMock,
    getAccessToken: getAccessTokenMock,
  })
})

afterEach(() => {
  vi.clearAllMocks()
})

beforeAll(() => {
  configure({ asyncUtilTimeout: 5000 })
})

afterAll(() => {
  configure({ asyncUtilTimeout: 1000 })
})

describe('useImageProcessingPoll — state machine', () => {
  it('does not fetch when recipe is null', async () => {
    const onReady = vi.fn()
    renderHook(() => useImageProcessingPoll(null, onReady))

    // Give the hook a few microtasks to settle any effects.
    await Promise.resolve()
    await Promise.resolve()

    expect(fetchMock).not.toHaveBeenCalled()
    expect(onReady).not.toHaveBeenCalled()
  })

  it('does not fetch when all images already have processedAt', async () => {
    const onReady = vi.fn()
    const recipe = makeRecipe({
      coverImage: { key: 'recipes/r1/cover', alt: 'cover', processedAt: 1000 },
      steps: [
        { order: 1, text: 'Step 1', image: { key: 'recipes/r1/step-1', alt: 'step', processedAt: 1000 } },
      ],
    })

    renderHook(() => useImageProcessingPoll(recipe, onReady))

    await Promise.resolve()
    await Promise.resolve()

    expect(fetchMock).not.toHaveBeenCalled()
    expect(onReady).not.toHaveBeenCalled()
  })

  it('fetches when recipe has at least one image with a key but no processedAt', async () => {
    const onReady = vi.fn()
    const recipe = makeRecipe({
      coverImage: { key: 'recipes/r1/cover', alt: 'cover' },
    })

    // Never-resolving response so we only observe the first fetch kickoff.
    fetchMock.mockImplementation(() => new Promise(() => {}))

    renderHook(() => useImageProcessingPoll(recipe, onReady))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled()
    })
    expect(fetchMock.mock.calls[0][0]).toBe('token-123')
    expect(fetchMock.mock.calls[0][1]).toBe('r1')
  })

  it('invokes onReady with { key, processedAt } for newly-ready images only', async () => {
    const onReady = vi.fn()
    const recipe = makeRecipe({
      coverImage: { key: 'recipes/r1/cover', alt: 'cover' },
      steps: [
        { order: 1, text: 'Step 1', image: { key: 'recipes/r1/step-1', alt: 'step' } },
      ],
    })

    // Server response: cover is ready, step-1 still processing.
    fetchMock.mockResolvedValueOnce(
      makeRecipe({
        coverImage: { key: 'recipes/r1/cover', alt: 'cover', processedAt: 5000 },
        steps: [
          { order: 1, text: 'Step 1', image: { key: 'recipes/r1/step-1', alt: 'step' } },
        ],
      })
    )
    // Keep subsequent ticks pending so we only assert on the first flip.
    fetchMock.mockImplementation(() => new Promise(() => {}))

    renderHook(() => useImageProcessingPoll(recipe, onReady))

    await waitFor(() => {
      expect(onReady).toHaveBeenCalled()
    })

    const [updates] = onReady.mock.calls[0]
    expect(updates).toEqual([{ key: 'recipes/r1/cover', processedAt: 5000 }])
  })

  it('does not duplicate onReady entries across ticks', async () => {
    const onReady = vi.fn()
    const recipe = makeRecipe({
      coverImage: { key: 'recipes/r1/cover', alt: 'cover' },
      steps: [
        { order: 1, text: 'Step 1', image: { key: 'recipes/r1/step-1', alt: 'step' } },
      ],
    })

    // Tick 1: cover flips to ready, step-1 still processing.
    fetchMock.mockResolvedValueOnce(
      makeRecipe({
        coverImage: { key: 'recipes/r1/cover', alt: 'cover', processedAt: 5000 },
        steps: [
          { order: 1, text: 'Step 1', image: { key: 'recipes/r1/step-1', alt: 'step' } },
        ],
      })
    )
    // Tick 2: step-1 flips to ready too; cover is unchanged.
    fetchMock.mockResolvedValueOnce(
      makeRecipe({
        coverImage: { key: 'recipes/r1/cover', alt: 'cover', processedAt: 5000 },
        steps: [
          { order: 1, text: 'Step 1', image: { key: 'recipes/r1/step-1', alt: 'step', processedAt: 6000 } },
        ],
      })
    )
    // Stall any further ticks.
    fetchMock.mockImplementation(() => new Promise(() => {}))

    vi.useFakeTimers()
    try {
      renderHook(() => useImageProcessingPoll(recipe, onReady))

      // Advance through two poll ticks.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1500)
      })
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1500)
      })

      await waitFor(() => {
        expect(onReady).toHaveBeenCalledTimes(2)
      })
    } finally {
      vi.useRealTimers()
    }

    // Each call should only carry the entries that flipped on that tick.
    expect(onReady.mock.calls[0][0]).toEqual([
      { key: 'recipes/r1/cover', processedAt: 5000 },
    ])
    expect(onReady.mock.calls[1][0]).toEqual([
      { key: 'recipes/r1/step-1', processedAt: 6000 },
    ])
  })

  it('delegates 401 responses to handleSessionError and stops polling', async () => {
    const onReady = vi.fn()
    const recipe = makeRecipe({
      coverImage: { key: 'recipes/r1/cover', alt: 'cover' },
    })

    const authErr = new Error('401 Unauthorized')
    fetchMock.mockRejectedValueOnce(authErr)
    // If polling (incorrectly) continues, further fetches would pend.
    fetchMock.mockImplementation(() => new Promise(() => {}))
    // Session errors do the redirect — report true so the hook knows it's handled.
    vi.mocked(authApi.handleSessionError).mockReturnValue(true)

    vi.useFakeTimers()
    try {
      renderHook(() => useImageProcessingPoll(recipe, onReady))

      await waitFor(() => {
        expect(vi.mocked(authApi.handleSessionError)).toHaveBeenCalled()
      })

      const [errArg, logoutArg, navigateArg] = vi.mocked(authApi.handleSessionError).mock.calls[0]
      expect(errArg).toBe(authErr)
      expect(logoutArg).toBe(logoutMock)
      expect(navigateArg).toBe(navigateMock)

      // Should not continue polling after the 401.
      const callsAfter401 = fetchMock.mock.calls.length
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1500 * 3)
      })
      expect(fetchMock.mock.calls.length).toBe(callsAfter401)
    } finally {
      vi.useRealTimers()
    }

    expect(onReady).not.toHaveBeenCalled()
  })

  it('stops polling silently on 404 (recipe deleted)', async () => {
    const onReady = vi.fn()
    const recipe = makeRecipe({
      coverImage: { key: 'recipes/r1/cover', alt: 'cover' },
    })

    fetchMock.mockRejectedValueOnce(new Error('404 Not Found'))
    // Subsequent ticks would error too if polling continues.
    fetchMock.mockImplementation(() => new Promise(() => {}))

    vi.useFakeTimers()
    try {
      renderHook(() => useImageProcessingPoll(recipe, onReady))

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledTimes(1)
      })

      // Advance several intervals; no more fetches should fire.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1500 * 5)
      })
      expect(fetchMock).toHaveBeenCalledTimes(1)
    } finally {
      vi.useRealTimers()
    }

    expect(vi.mocked(authApi.handleSessionError)).not.toHaveBeenCalled()
    expect(onReady).not.toHaveBeenCalled()
  })

  it('aborts the in-flight request and suppresses state updates on unmount', async () => {
    const onReady = vi.fn()
    const recipe = makeRecipe({
      coverImage: { key: 'recipes/r1/cover', alt: 'cover' },
    })

    const seenSignals: AbortSignal[] = []
    let resolveFirst: ((r: Recipe) => void) | null = null
    fetchMock.mockImplementationOnce((_token, _id, signal?: AbortSignal) => {
      if (signal) seenSignals.push(signal)
      return new Promise<Recipe>((resolve) => {
        resolveFirst = resolve
      })
    })

    const { unmount } = renderHook(() => useImageProcessingPoll(recipe, onReady))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled()
    })

    unmount()

    expect(seenSignals.length).toBeGreaterThan(0)
    expect(seenSignals[0].aborted).toBe(true)

    // Resolve the already-aborted request — no onReady should fire.
    await act(async () => {
      resolveFirst?.(
        makeRecipe({
          coverImage: { key: 'recipes/r1/cover', alt: 'cover', processedAt: 9999 },
        })
      )
    })

    expect(onReady).not.toHaveBeenCalled()
  })

  it('aborts in-flight and re-evaluates readiness when recipe.id changes', async () => {
    const onReady = vi.fn()
    const recipeA = makeRecipe({
      id: 'recipe-a',
      coverImage: { key: 'recipes/a/cover', alt: 'cover' },
    })
    const recipeB = makeRecipe({
      id: 'recipe-b',
      coverImage: { key: 'recipes/b/cover', alt: 'cover' },
    })

    const seenSignals: AbortSignal[] = []
    let resolveRecipeA: ((r: Recipe) => void) | null = null
    fetchMock.mockImplementationOnce((_token, _id, signal?: AbortSignal) => {
      if (signal) seenSignals.push(signal)
      return new Promise<Recipe>((resolve) => {
        resolveRecipeA = resolve
      })
    })
    // Recipe B fetch: stall — we just need to observe the first fetch aborted.
    fetchMock.mockImplementation((_token, _id, signal?: AbortSignal) => {
      if (signal) seenSignals.push(signal)
      return new Promise(() => {})
    })

    const { rerender } = renderHook(
      ({ recipe }: { recipe: Recipe }) => useImageProcessingPoll(recipe, onReady),
      { initialProps: { recipe: recipeA } }
    )

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('token-123', 'recipe-a', expect.anything())
    })

    rerender({ recipe: recipeB })

    await waitFor(() => {
      expect(seenSignals[0].aborted).toBe(true)
    })
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('token-123', 'recipe-b', expect.anything())
    })

    // Resolving recipe A's request late must NOT trigger onReady for recipe B.
    await act(async () => {
      resolveRecipeA?.(
        makeRecipe({
          id: 'recipe-a',
          coverImage: { key: 'recipes/a/cover', alt: 'cover', processedAt: 1111 },
        })
      )
    })

    expect(onReady).not.toHaveBeenCalled()
  })
})

describe('useImageProcessingPoll — timing', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('fires exactly N fetches after N × 1500ms have elapsed', async () => {
    const onReady = vi.fn()
    const recipe = makeRecipe({
      coverImage: { key: 'recipes/r1/cover', alt: 'cover' },
    })

    // Always respond with the same unready recipe so polling keeps running.
    fetchMock.mockResolvedValue(
      makeRecipe({
        coverImage: { key: 'recipes/r1/cover', alt: 'cover' },
      })
    )

    renderHook(() => useImageProcessingPoll(recipe, onReady))

    // Just before the first interval elapses — nothing yet, or at most the
    // kickoff tick if the hook fires one immediately. Allow either N=0 or N=1
    // here and assert cadence going forward.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    // After 1 full interval the count should be exactly 1 more than initial.
    const initial = fetchMock.mock.calls.length
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500)
    })
    await waitFor(() => {
      expect(fetchMock.mock.calls.length).toBe(initial + 1)
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500)
    })
    await waitFor(() => {
      expect(fetchMock.mock.calls.length).toBe(initial + 2)
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500)
    })
    await waitFor(() => {
      expect(fetchMock.mock.calls.length).toBe(initial + 3)
    })
  })

  it('stops polling after 60s timeout and reports timedOut: true', async () => {
    const onReady = vi.fn()
    const recipe = makeRecipe({
      coverImage: { key: 'recipes/r1/cover', alt: 'cover' },
    })

    fetchMock.mockResolvedValue(
      makeRecipe({
        coverImage: { key: 'recipes/r1/cover', alt: 'cover' },
      })
    )

    const { result } = renderHook(() => useImageProcessingPoll(recipe, onReady))

    // Advance past the 60s timeout.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000)
    })
    // Let any pending microtasks settle.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    await waitFor(() => {
      expect(result.current.timedOut).toBe(true)
    })

    const callsAtTimeout = fetchMock.mock.calls.length

    // Polling must be stopped — no more fetches in the next few intervals.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500 * 5)
    })
    expect(fetchMock.mock.calls.length).toBe(callsAtTimeout)
  })

  it('honours custom intervalMs and timeoutMs overrides', async () => {
    const onReady = vi.fn()
    const recipe = makeRecipe({
      coverImage: { key: 'recipes/r1/cover', alt: 'cover' },
    })

    fetchMock.mockResolvedValue(
      makeRecipe({
        coverImage: { key: 'recipes/r1/cover', alt: 'cover' },
      })
    )

    const { result } = renderHook(() =>
      useImageProcessingPoll(recipe, onReady, { intervalMs: 500, timeoutMs: 2000 })
    )

    const initial = fetchMock.mock.calls.length

    // After 500ms, one more fetch has fired at the custom cadence.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500)
    })
    await waitFor(() => {
      expect(fetchMock.mock.calls.length).toBe(initial + 1)
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500)
    })
    await waitFor(() => {
      expect(fetchMock.mock.calls.length).toBe(initial + 2)
    })

    // Past the custom 2000ms timeout.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000)
    })
    await waitFor(() => {
      expect(result.current.timedOut).toBe(true)
    })

    const callsAtTimeout = fetchMock.mock.calls.length
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500 * 5)
    })
    expect(fetchMock.mock.calls.length).toBe(callsAtTimeout)
  })
})
