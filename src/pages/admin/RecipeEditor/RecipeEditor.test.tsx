import {
  createDraft,
  deleteRecipe,
  fetchAllRecipes,
  fetchMyRecipes,
  fetchTags,
  publishRecipe,
  unpublishRecipe,
  updateRecipe,
} from '@api/recipes'
import { useAuth } from '@contexts/AuthContext'
import { useAutosave, type AutosaveStatus, type UseAutosaveResult } from '@hooks/useAutosave'
import type {
  ImageReadyUpdate,
  UseImageProcessingPollResult,
} from '@hooks/useImageProcessingPoll'
import type { Recipe } from '@models/recipe'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { createMemoryRouter, Link, RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'

import RecipeEditor from './RecipeEditor'

vi.mock('@api/recipes', () => ({
  createDraft: vi.fn(),
  updateRecipe: vi.fn(),
  publishRecipe: vi.fn(),
  unpublishRecipe: vi.fn(),
  deleteRecipe: vi.fn(),
  fetchAllRecipes: vi.fn(),
  fetchMyRecipes: vi.fn(),
  fetchTags: vi.fn(),
  getUploadUrl: vi.fn(),
}))

vi.mock('@contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

// Spy on useAutosave so we can assert how the editor wires it up and
// trigger state transitions deterministically without relying on timers.
interface AutosaveMockControls {
  lastArgs: {
    state: { dirty: boolean } | null
    saveFn: ((state: unknown, signal: AbortSignal) => Promise<void>) | null
    options: { intervalMs?: number } | null
  }
  setResult: (next: Partial<UseAutosaveResult>) => void
  triggerSuccess: () => Promise<void>
  reset: () => void
  hookResult: UseAutosaveResult
  retryMock: Mock<() => void>
  flushMock: Mock<() => Promise<void>>
  callCount: number
}

const autosaveControls: AutosaveMockControls = {
  lastArgs: { state: null, saveFn: null, options: null },
  setResult: () => {},
  triggerSuccess: async () => {},
  reset: () => {},
  hookResult: { status: 'idle', lastSavedAt: null, retry: vi.fn(), flush: vi.fn().mockResolvedValue(undefined) },
  retryMock: vi.fn(),
  flushMock: vi.fn().mockResolvedValue(undefined),
  callCount: 0,
}

vi.mock('@hooks/useAutosave', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/useAutosave')>()
  const { useState, useRef } = await import('react')

  const useAutosaveMock = <T extends { dirty: boolean }>(
    state: T,
    saveFn: (state: T, signal: AbortSignal) => Promise<void>,
    options?: { intervalMs?: number }
  ): UseAutosaveResult => {
    autosaveControls.callCount += 1
    autosaveControls.lastArgs = {
      state,
      saveFn: saveFn as (state: unknown, signal: AbortSignal) => Promise<void>,
      options: options ?? null,
    }
    const [result, setResult] = useState<UseAutosaveResult>(autosaveControls.hookResult)

    // Expose setters through the shared controls so tests can mutate state.
    const setResultRef = useRef(setResult)
    setResultRef.current = setResult
    autosaveControls.setResult = (next) => {
      setResultRef.current((prev) => ({ ...prev, ...next }))
      autosaveControls.hookResult = { ...autosaveControls.hookResult, ...next }
    }

    return result
  }

  return {
    ...actual,
    useAutosave: useAutosaveMock,
  }
})

// Spy on useImageProcessingPoll so tests can:
// - capture the onReady callback and invoke it to simulate a ready image
// - toggle `timedOut` to assert the timeout banner
// The real hook talks to the network and to auth/navigation — a mock is the
// only boundary that keeps the editor tests pure DOM + reducer assertions.
interface PollMockControls {
  lastArgs: {
    recipe: Recipe | null
    onReady: ((updates: ImageReadyUpdate[]) => void) | null
  }
  callCount: number
  setTimedOut: (next: boolean) => void
  triggerReady: (updates: ImageReadyUpdate[]) => void
  reset: () => void
}

const pollControls: PollMockControls = {
  lastArgs: { recipe: null, onReady: null },
  callCount: 0,
  setTimedOut: () => {},
  triggerReady: () => {},
  reset: () => {},
}

vi.mock('@hooks/useImageProcessingPoll', async () => {
  const { useState, useRef } = await import('react')

  const useImageProcessingPollMock = (
    recipe: Recipe | null,
    onReady: (updates: ImageReadyUpdate[]) => void
  ): UseImageProcessingPollResult => {
    pollControls.callCount += 1
    pollControls.lastArgs = { recipe, onReady }

    const [timedOut, setTimedOut] = useState(false)
    const setTimedOutRef = useRef(setTimedOut)
    setTimedOutRef.current = setTimedOut
    const onReadyRef = useRef(onReady)
    onReadyRef.current = onReady

    pollControls.setTimedOut = (next: boolean) => {
      act(() => {
        setTimedOutRef.current(next)
      })
    }
    pollControls.triggerReady = (updates: ImageReadyUpdate[]) => {
      act(() => {
        onReadyRef.current(updates)
      })
    }

    return { timedOut }
  }

  return {
    useImageProcessingPoll: useImageProcessingPollMock,
  }
})

// ImageUpload is replaced with a stub so we can assert on the props passed
// (and trigger the upload-started/completed callbacks without a real file input).
// The new (#198) contract: ImageUpload takes `slug` + `imageType` and exposes
// `onUploadStarted` / `onUploadCompleted` — there is no `onUpload(key)`.
interface ImageUploadStubProps {
  recipeId: string
  slug: string
  imageType: 'cover' | `step-${string}`
  onUploadStarted?: () => void
  onUploadCompleted?: () => void
}

vi.mock('@components/ImageUpload', () => ({
  default: ({
    recipeId,
    slug,
    imageType,
    onUploadStarted,
    onUploadCompleted,
  }: ImageUploadStubProps) => {
    // Use 'cover' vs 'step' as a stable testid suffix so multiple step uploads
    // don't collide on the per-uuid imageType string.
    const kind = imageType === 'cover' ? 'cover' : 'step'
    return (
      <div>
        <span data-testid={`image-upload-recipe-id-${kind}`}>{recipeId}</span>
        <span data-testid={`image-upload-slug-${kind}`}>{slug}</span>
        <span data-testid={`image-upload-imagetype-${kind}`}>{imageType}</span>
        <button type="button" onClick={() => onUploadStarted?.()}>
          Start upload {kind} image
        </button>
        <button type="button" onClick={() => onUploadCompleted?.()}>
          Complete upload {kind} image
        </button>
      </div>
    )
  },
}))

const fillValidCoverImage = async (user: UserEvent) => {
  await user.type(screen.getByLabelText(/cover image alt text/i), 'Cover alt text')
  // Simulate the image processing poll detecting the uploaded cover as ready.
  // Without this, the publish gate would consider the cover image absent
  // (no processedAt) and Publish stays disabled.
  pollControls.triggerReady([
    { imageType: 'cover', processedAt: 1_700_000_000_000 },
  ])
}

const fillAllRequired = async (user: UserEvent) => {
  await user.type(screen.getByRole('textbox', { name: /title/i }), 'My Recipe')
  await user.type(screen.getByRole('textbox', { name: /intro/i }), 'A great recipe')
  await user.type(screen.getAllByRole('textbox', { name: /item/i })[0], 'Flour')
  await user.type(screen.getAllByRole('textbox', { name: /step.*text/i })[0], 'Mix it all')
  await fillValidCoverImage(user)
}

const draftRecipe: Recipe = {
  id: 'rec-001',
  title: 'Spaghetti Bolognese',
  slug: 'spaghetti-bolognese',
  coverImage: {
    alt: 'Spaghetti bolognese',
    // Readiness is defaulted to "already processed" for the shared fixture so
    // existing tests continue to exercise the ready-branch of the publish
    // gate. Tests that need the unready branch override coverImage explicitly.
    processedAt: 1_700_000_000_000,
  },
  tags: ['Italian', 'Pasta'],
  prepTime: 15,
  cookTime: 45,
  servings: 4,
  createdAt: '2026-03-20T10:00:00Z',
  updatedAt: '2026-03-22T10:00:00Z',
  intro: 'A classic Italian dish.',
  ingredients: [{ item: 'Spaghetti', quantity: '400', unit: 'g' }],
  steps: [{ stepId: '11111111-1111-4111-8111-111111111111', order: 1, text: 'Boil pasta' }],
  authorId: 'user-1',
  authorName: 'Akli',
  status: 'draft',
}

const publishedRecipe: Recipe = { ...draftRecipe, status: 'published' }

const renderEditor = (route = '/admin/recipes/new') => {
  const router = createMemoryRouter(
    [
      { path: '/admin/recipes/new', element: <RecipeEditor /> },
      { path: '/admin/recipes/:id/edit', element: <RecipeEditor /> },
      { path: '/admin/recipes', element: <div>Recipe list page</div> },
    ],
    { initialEntries: [route] }
  )
  return render(<RouterProvider router={router} />)
}

describe('RecipeEditor page', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    autosaveControls.lastArgs = { state: null, saveFn: null, options: null }
    autosaveControls.callCount = 0
    autosaveControls.retryMock = vi.fn()
    autosaveControls.flushMock = vi.fn().mockResolvedValue(undefined)
    autosaveControls.hookResult = {
      status: 'idle',
      lastSavedAt: null,
      retry: autosaveControls.retryMock,
      flush: autosaveControls.flushMock,
    }
    pollControls.lastArgs = { recipe: null, onReady: null }
    pollControls.callCount = 0
    pollControls.setTimedOut = () => {}
    pollControls.triggerReady = () => {}

    vi.mocked(useAuth).mockReturnValue({
      getAccessToken: vi.fn().mockResolvedValue('token-123'),
      isAdmin: true,
      user: { email: 'admin@akli.dev', groups: ['admin'] },
      isAuthenticated: true,
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
    })
    vi.mocked(fetchTags).mockResolvedValue([
      { tag: 'Italian', count: 5 },
      { tag: 'Thai', count: 3 },
    ])
    vi.mocked(fetchAllRecipes).mockResolvedValue([draftRecipe])
    vi.mocked(fetchMyRecipes).mockResolvedValue([draftRecipe])
    vi.mocked(createDraft).mockResolvedValue({ id: 'rec-new', slug: 'rec-new' })
    vi.mocked(updateRecipe).mockResolvedValue(draftRecipe)
    vi.mocked(publishRecipe).mockResolvedValue(publishedRecipe)
    vi.mocked(unpublishRecipe).mockResolvedValue(draftRecipe)
    vi.mocked(deleteRecipe).mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('mount — /admin/recipes/new', () => {
    it('calls createDraft on mount', async () => {
      renderEditor('/admin/recipes/new')

      await waitFor(() => {
        expect(createDraft).toHaveBeenCalledWith('token-123')
      })
    })

    it('replaces the URL with /admin/recipes/:id/edit after createDraft resolves', async () => {
      const EditorWithUrl = () => {
        const path = window.location?.pathname ?? ''
        return (
          <>
            <div data-testid="current-path">{path}</div>
            <RecipeEditor />
          </>
        )
      }

      const router = createMemoryRouter(
        [
          { path: '/admin/recipes/new', element: <EditorWithUrl /> },
          { path: '/admin/recipes/:id/edit', element: <EditorWithUrl /> },
        ],
        { initialEntries: ['/admin/recipes/new'] }
      )

      render(<RouterProvider router={router} />)

      await waitFor(() => {
        expect(createDraft).toHaveBeenCalled()
      })

      // URL should now be /admin/recipes/rec-new/edit — we assert this via
      // the router being on the :id/edit path (cover image recipeId prop).
      await waitFor(() => {
        expect(
          screen.getByTestId('image-upload-recipe-id-cover')
        ).toHaveTextContent('rec-new')
      })
    })

    it('does NOT refetch the just-created draft via fetchAllRecipes or fetchMyRecipes', async () => {
      renderEditor('/admin/recipes/new')

      await waitFor(() => {
        expect(createDraft).toHaveBeenCalled()
      })

      // Give any would-be refetch a tick to fire.
      await Promise.resolve()
      await Promise.resolve()

      expect(fetchAllRecipes).not.toHaveBeenCalled()
      expect(fetchMyRecipes).not.toHaveBeenCalled()
    })

    it('passes a non-empty recipeId to ImageUpload once createDraft resolves', async () => {
      renderEditor('/admin/recipes/new')

      await waitFor(() => {
        const idSpan = screen.getByTestId('image-upload-recipe-id-cover')
        expect(idSpan).toHaveTextContent('rec-new')
      })
    })
  })

  describe('mount — /admin/recipes/:id/edit', () => {
    it('fetches the recipe and renders title/intro from the response', async () => {
      renderEditor('/admin/recipes/rec-001/edit')

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /title/i })).toHaveValue('Spaghetti Bolognese')
      })
      expect(screen.getByRole('textbox', { name: /intro/i })).toHaveValue('A classic Italian dish.')
    })

    it('does NOT call createDraft on edit mount', async () => {
      renderEditor('/admin/recipes/rec-001/edit')

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /title/i })).toHaveValue('Spaghetti Bolognese')
      })

      expect(createDraft).not.toHaveBeenCalled()
    })

    it('derives published mode when status === "published" (primary button is Update, not Publish)', async () => {
      vi.mocked(fetchAllRecipes).mockResolvedValue([publishedRecipe])
      vi.mocked(fetchMyRecipes).mockResolvedValue([publishedRecipe])

      renderEditor('/admin/recipes/rec-001/edit')

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /title/i })).toHaveValue('Spaghetti Bolognese')
      })

      expect(screen.queryByRole('button', { name: /^publish$/i })).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument()
    })
  })

  describe('autosave integration', () => {
    it('invokes useAutosave with (state, saveFn, { intervalMs: 2000 })', async () => {
      renderEditor('/admin/recipes/new')

      await waitFor(() => {
        expect(autosaveControls.lastArgs.state).not.toBeNull()
      })

      expect(autosaveControls.lastArgs.options).toEqual({ intervalMs: 2000 })
      expect(typeof autosaveControls.lastArgs.saveFn).toBe('function')
    })

    it('saveFn passed to useAutosave calls updateRecipe with the current recipe id', async () => {
      renderEditor('/admin/recipes/new')

      await waitFor(() => {
        expect(createDraft).toHaveBeenCalled()
      })
      await waitFor(() => {
        expect(autosaveControls.lastArgs.saveFn).not.toBeNull()
      })

      const saveFn = autosaveControls.lastArgs.saveFn!
      const state = autosaveControls.lastArgs.state as Record<string, unknown>
      const controller = new AbortController()
      await saveFn(state, controller.signal)

      expect(updateRecipe).toHaveBeenCalled()
      const callArgs = vi.mocked(updateRecipe).mock.calls[0]
      expect(callArgs[1]).toBe('rec-new')
    })
  })

  describe('AutosaveStatus rendering', () => {
    it('renders "Saving…" when the hook reports status === "saving"', async () => {
      autosaveControls.hookResult = {
        status: 'saving' as AutosaveStatus,
        lastSavedAt: null,
        retry: vi.fn(),
        flush: vi.fn().mockResolvedValue(undefined),
      }

      renderEditor('/admin/recipes/new')

      await waitFor(() => {
        expect(screen.getByText(/saving…/i)).toBeInTheDocument()
      })
    })

    it('renders "Saved" when the hook reports status === "saved"', async () => {
      autosaveControls.hookResult = {
        status: 'saved' as AutosaveStatus,
        lastSavedAt: new Date('2026-04-19T12:00:00Z'),
        retry: vi.fn(),
        flush: vi.fn().mockResolvedValue(undefined),
      }

      renderEditor('/admin/recipes/new')

      await waitFor(() => {
        expect(screen.getByText(/saved/i)).toBeInTheDocument()
      })
    })
  })

  describe('draft-mode submit (Publish)', () => {
    it('does NOT call publishRecipe when required fields are missing (button disabled)', async () => {
      const user = userEvent.setup()
      renderEditor('/admin/recipes/new')

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /publish/i })).toBeInTheDocument()
      })

      const publishButton = screen.getByRole('button', { name: /publish/i })
      expect(publishButton).toBeDisabled()

      await user.click(publishButton)

      expect(publishRecipe).not.toHaveBeenCalled()
    })

    it('calls publishRecipe(token, id) when validation passes', async () => {
      const user = userEvent.setup()
      renderEditor('/admin/recipes/new')

      await waitFor(() => {
        expect(createDraft).toHaveBeenCalled()
      })

      await fillAllRequired(user)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /publish/i })).not.toBeDisabled()
      })

      await user.click(screen.getByRole('button', { name: /publish/i }))

      await waitFor(() => {
        expect(publishRecipe).toHaveBeenCalledWith('token-123', 'rec-new')
      })
    })

    it('flips to published mode on successful publish — primary button becomes Update, Unpublish appears, no navigation', async () => {
      const user = userEvent.setup()
      renderEditor('/admin/recipes/new')

      await waitFor(() => {
        expect(createDraft).toHaveBeenCalled()
      })

      await fillAllRequired(user)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /publish/i })).not.toBeDisabled()
      })

      await user.click(screen.getByRole('button', { name: /publish/i }))

      await waitFor(() => {
        expect(publishRecipe).toHaveBeenCalled()
      })

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument()
      })
      expect(screen.queryByRole('button', { name: /^publish$/i })).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: /unpublish/i })).toBeInTheDocument()
    })
  })

  describe('Publish button disabled state — accessibility', () => {
    it('is disabled with aria-describedby pointing at a visible missing-fields list', async () => {
      renderEditor('/admin/recipes/new')

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /publish/i })).toBeInTheDocument()
      })

      const publishButton = screen.getByRole('button', { name: /publish/i })
      expect(publishButton).toBeDisabled()

      const describedBy = publishButton.getAttribute('aria-describedby')
      expect(describedBy).toBeTruthy()

      const describer = document.getElementById(describedBy as string)
      expect(describer).not.toBeNull()
      expect(describer).toBeVisible()
      expect(describer?.textContent ?? '').not.toBe('')
    })

    it('becomes enabled once all required fields are filled', async () => {
      const user = userEvent.setup()
      renderEditor('/admin/recipes/new')

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /publish/i })).toBeDisabled()
      })

      await fillAllRequired(user)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /publish/i })).not.toBeDisabled()
      })
    })
  })

  describe('published-mode submit (Update)', () => {
    beforeEach(() => {
      vi.mocked(fetchAllRecipes).mockResolvedValue([publishedRecipe])
      vi.mocked(fetchMyRecipes).mockResolvedValue([publishedRecipe])
    })

    it('calls updateRecipe(token, id, data) on Update click and does NOT change mode', async () => {
      const user = userEvent.setup()
      renderEditor('/admin/recipes/rec-001/edit')

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /title/i })).toHaveValue('Spaghetti Bolognese')
      })

      await user.click(screen.getByRole('button', { name: /update/i }))

      await waitFor(() => {
        expect(updateRecipe).toHaveBeenCalledWith(
          'token-123',
          'rec-001',
          expect.objectContaining({ status: 'published' })
        )
      })

      // Primary button still reads "Update" — mode did not change.
      expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /^publish$/i })).not.toBeInTheDocument()
    })
  })

  describe('Unpublish', () => {
    beforeEach(() => {
      vi.mocked(fetchAllRecipes).mockResolvedValue([publishedRecipe])
      vi.mocked(fetchMyRecipes).mockResolvedValue([publishedRecipe])
    })

    it('is NOT visible when mode === "draft"', async () => {
      vi.mocked(fetchAllRecipes).mockResolvedValue([draftRecipe])
      vi.mocked(fetchMyRecipes).mockResolvedValue([draftRecipe])

      renderEditor('/admin/recipes/rec-001/edit')

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /title/i })).toHaveValue('Spaghetti Bolognese')
      })

      expect(screen.queryByRole('button', { name: /unpublish/i })).not.toBeInTheDocument()
    })

    it('calls unpublishRecipe(token, id) when the Unpublish button is clicked', async () => {
      const user = userEvent.setup()
      renderEditor('/admin/recipes/rec-001/edit')

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /unpublish/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /unpublish/i }))

      await waitFor(() => {
        expect(unpublishRecipe).toHaveBeenCalledWith('token-123', 'rec-001')
      })
    })

    it('flips back to draft mode after unpublish — primary button becomes Publish', async () => {
      const user = userEvent.setup()
      renderEditor('/admin/recipes/rec-001/edit')

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /unpublish/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /unpublish/i }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^publish$/i })).toBeInTheDocument()
      })
      expect(screen.queryByRole('button', { name: /update/i })).not.toBeInTheDocument()
    })
  })

  describe('Discard draft', () => {
    it('renders a "Discard draft" button when mode === "draft"', async () => {
      renderEditor('/admin/recipes/rec-001/edit')

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /title/i })).toHaveValue('Spaghetti Bolognese')
      })

      expect(screen.getByRole('button', { name: /discard draft/i })).toBeInTheDocument()
    })

    it('opens a ConfirmDialog on click', async () => {
      const user = userEvent.setup()
      renderEditor('/admin/recipes/rec-001/edit')

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /discard draft/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /discard draft/i }))

      const dialog = await screen.findByRole('dialog')
      expect(dialog).toBeInTheDocument()
    })

    it('confirm calls deleteRecipe(token, id) and navigates to /admin/recipes', async () => {
      const user = userEvent.setup()
      renderEditor('/admin/recipes/rec-001/edit')

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /discard draft/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /discard draft/i }))

      const dialog = await screen.findByRole('dialog')
      // Pick the destructive confirm button inside the dialog (the button whose
      // accessible name matches "discard" but is NOT the one that opened the dialog).
      const confirmButton = within(dialog).getByRole('button', { name: /discard/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(deleteRecipe).toHaveBeenCalledWith('token-123', 'rec-001')
      })

      await waitFor(() => {
        expect(screen.getByText(/recipe list page/i)).toBeInTheDocument()
      })
    })

    it('cancel does NOT call deleteRecipe and dismisses the dialog', async () => {
      const user = userEvent.setup()
      renderEditor('/admin/recipes/rec-001/edit')

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /discard draft/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /discard draft/i }))

      const dialog = await screen.findByRole('dialog')
      const cancelButton = within(dialog).getByRole('button', { name: /cancel|stay/i })
      await user.click(cancelButton)

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
      expect(deleteRecipe).not.toHaveBeenCalled()
    })
  })

  describe('form field rendering', () => {
    it('renders title, intro, and cover alt inputs', async () => {
      renderEditor('/admin/recipes/new')

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /title/i })).toBeInTheDocument()
      })

      expect(screen.getByRole('textbox', { name: /intro/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/cover image alt text/i)).toBeInTheDocument()
    })

    it('populates form from fetched recipe on edit mount', async () => {
      renderEditor('/admin/recipes/rec-001/edit')

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /title/i })).toHaveValue('Spaghetti Bolognese')
      })

      expect(screen.getByRole('textbox', { name: /intro/i })).toHaveValue('A classic Italian dish.')
    })
  })

  describe('error handling', () => {
    it('shows an error toast when publishRecipe fails', async () => {
      vi.mocked(publishRecipe).mockRejectedValue(new Error('500 Internal Server Error'))
      const user = userEvent.setup()
      renderEditor('/admin/recipes/new')

      await waitFor(() => {
        expect(createDraft).toHaveBeenCalled()
      })

      await fillAllRequired(user)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /publish/i })).not.toBeDisabled()
      })

      await user.click(screen.getByRole('button', { name: /publish/i }))

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument()
      })
    })

    it('shows an error toast when updateRecipe fails in published mode', async () => {
      vi.mocked(fetchAllRecipes).mockResolvedValue([publishedRecipe])
      vi.mocked(fetchMyRecipes).mockResolvedValue([publishedRecipe])
      vi.mocked(updateRecipe).mockRejectedValue(new Error('500 Internal Server Error'))

      const user = userEvent.setup()
      renderEditor('/admin/recipes/rec-001/edit')

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /update/i }))

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument()
      })
    })
  })

  describe('tag input wiring', () => {
    it('typing in the tag input surfaces a suggestion and clicking adds a chip', async () => {
      const user = userEvent.setup()
      renderEditor('/admin/recipes/new')

      await waitFor(() => {
        expect(fetchTags).toHaveBeenCalled()
      })

      const tagInput = screen.getByRole('combobox')
      await user.type(tagInput, 'Ita')

      const listbox = await screen.findByRole('listbox')
      const suggestion = within(listbox).getByRole('option', { name: 'Italian' })
      await user.click(suggestion)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /remove italian/i })).toBeInTheDocument()
      })
    })
  })

  describe('unsaved-changes confirmation', () => {
    it('does not prevent beforeunload when the form is pristine', async () => {
      renderEditor('/admin/recipes/rec-001/edit')

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /title/i })).toHaveValue('Spaghetti Bolognese')
      })

      const event = new Event('beforeunload', { cancelable: true })
      window.dispatchEvent(event)

      expect(event.defaultPrevented).toBe(false)
    })

    it('prevents beforeunload once the user has made edits (dirty form)', async () => {
      const user = userEvent.setup()
      renderEditor('/admin/recipes/rec-001/edit')

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /title/i })).toHaveValue('Spaghetti Bolognese')
      })

      await user.type(screen.getByRole('textbox', { name: /title/i }), ' Supreme')

      const event = new Event('beforeunload', { cancelable: true })
      window.dispatchEvent(event)

      expect(event.defaultPrevented).toBe(true)
    })

    it('beforeunload stops preventing default after autosave success fires MARK_PRISTINE', async () => {
      const user = userEvent.setup()
      renderEditor('/admin/recipes/rec-001/edit')

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /title/i })).toHaveValue('Spaghetti Bolognese')
      })

      await user.type(screen.getByRole('textbox', { name: /title/i }), ' Supreme')

      // Simulate autosave success via the mocked hook.
      autosaveControls.setResult({
        status: 'saved',
        lastSavedAt: new Date('2026-04-19T12:00:00Z'),
      })

      // Wait for the MARK_PRISTINE dispatch to settle.
      await waitFor(() => {
        const event = new Event('beforeunload', { cancelable: true })
        window.dispatchEvent(event)
        expect(event.defaultPrevented).toBe(false)
      })
    })

    it('blocks React Router navigation and shows a confirmation dialogue when the form is dirty', async () => {
      const user = userEvent.setup()

      const EditorWithBackLink = () => (
        <>
          <Link to="/admin/recipes">Back to list</Link>
          <RecipeEditor />
        </>
      )

      const router = createMemoryRouter(
        [
          { path: '/admin/recipes/:id/edit', element: <EditorWithBackLink /> },
          { path: '/admin/recipes', element: <div>Recipe list page</div> },
        ],
        { initialEntries: ['/admin/recipes/rec-001/edit'] }
      )

      render(<RouterProvider router={router} />)

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /title/i })).toHaveValue('Spaghetti Bolognese')
      })

      await user.type(screen.getByRole('textbox', { name: /title/i }), ' Supreme')

      await user.click(screen.getByRole('link', { name: /back to list/i }))

      const dialog = await screen.findByRole('dialog')
      expect(dialog).toBeInTheDocument()
      expect(within(dialog).getByText(/unsaved changes/i)).toBeInTheDocument()
    })
  })

  describe('dynamic list announcements (aria-live)', () => {
    const findLiveRegionWith = (pattern: RegExp) => {
      const statusRegions = screen.getAllByRole('status')
      const match = statusRegions.find(
        (region) =>
          region.getAttribute('aria-live') === 'polite' && pattern.test(region.textContent ?? '')
      )
      if (!match) {
        throw new Error(
          `No aria-live="polite" region with text matching ${pattern}. Regions: ${statusRegions
            .map((r) => r.textContent)
            .join(' | ')}`
        )
      }
      return match
    }

    it('announces when an ingredient is added', async () => {
      const user = userEvent.setup()
      renderEditor('/admin/recipes/new')

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add ingredient/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /add ingredient/i }))

      await waitFor(() => {
        expect(findLiveRegionWith(/ingredient added/i)).toBeInTheDocument()
      })
    })

    it('announces when an ingredient is removed', async () => {
      const user = userEvent.setup()
      renderEditor('/admin/recipes/new')

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add ingredient/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /add ingredient/i }))

      const removeButtons = screen.getAllByRole('button', { name: /remove ingredient/i })
      await user.click(removeButtons[0])

      await waitFor(() => {
        expect(findLiveRegionWith(/ingredient removed/i)).toBeInTheDocument()
      })
    })

    it('announces when a step is added', async () => {
      const user = userEvent.setup()
      renderEditor('/admin/recipes/new')

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add step/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /add step/i }))

      await waitFor(() => {
        expect(findLiveRegionWith(/step added/i)).toBeInTheDocument()
      })
    })
  })

  describe('session expiry mid-edit', () => {
    it('preserves form state and shows a session-expired message when getAccessToken throws', async () => {
      vi.mocked(useAuth).mockReturnValue({
        getAccessToken: vi.fn().mockRejectedValue(new Error('Session expired')),
        isAdmin: true,
        user: { email: 'admin@akli.dev', groups: ['admin'] },
        isAuthenticated: true,
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
      })

      const user = userEvent.setup()
      renderEditor('/admin/recipes/rec-001/edit')

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /title/i })).toHaveValue('Spaghetti Bolognese')
      })

      await user.click(screen.getByRole('button', { name: /publish|update/i }))

      await waitFor(() => {
        expect(
          screen.getByText(/session expired.*please log in again/i)
        ).toBeInTheDocument()
      })

      expect(screen.getByRole('textbox', { name: /title/i })).toHaveValue('Spaghetti Bolognese')
    })
  })

  describe('image processing readiness', () => {
    const STEP_ID = '11111111-1111-4111-8111-111111111111'

    // A recipe whose cover image has been uploaded but not yet processed by the
    // resizer Lambda (processedAt absent). All other fields are valid so only
    // the readiness gate keeps Publish disabled.
    const recipeWithUnreadyCover: Recipe = {
      ...draftRecipe,
      coverImage: { alt: 'Spaghetti bolognese' },
    }

    // A recipe where the cover is ready but a step image is still processing.
    const recipeWithUnreadyStepImage: Recipe = {
      ...draftRecipe,
      steps: [
        {
          stepId: STEP_ID,
          order: 1,
          text: 'Boil pasta',
          image: { alt: 'Boiling pasta' },
        },
      ],
    }

    // A recipe where every image is ready — cover and step.
    const recipeFullyReady: Recipe = {
      ...draftRecipe,
      steps: [
        {
          stepId: STEP_ID,
          order: 1,
          text: 'Boil pasta',
          image: {
            alt: 'Boiling pasta',
            processedAt: 1_700_000_000_000,
          },
        },
      ],
    }

    it('disables Publish when the cover image is not yet processed (no processedAt) (AC 6, 7)', async () => {
      vi.mocked(fetchMyRecipes).mockResolvedValue([recipeWithUnreadyCover])
      vi.mocked(fetchAllRecipes).mockResolvedValue([recipeWithUnreadyCover])

      renderEditor('/admin/recipes/rec-001/edit')

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /title/i })).toHaveValue('Spaghetti Bolognese')
      })

      const publishButton = screen.getByRole('button', { name: /^publish$/i })
      expect(publishButton).toBeDisabled()

      const describedBy = publishButton.getAttribute('aria-describedby')
      expect(describedBy).toBeTruthy()
      const missingList = document.getElementById(describedBy as string)
      expect(missingList).not.toBeNull()
      // Cover presence is now signalled by coverImageProcessedAt — absent → "Cover image".
      expect(missingList?.textContent ?? '').toMatch(/cover image/i)
    })

    it('disables Publish when a step image has a key but no processedAt (AC 6, 7)', async () => {
      vi.mocked(fetchMyRecipes).mockResolvedValue([recipeWithUnreadyStepImage])
      vi.mocked(fetchAllRecipes).mockResolvedValue([recipeWithUnreadyStepImage])

      renderEditor('/admin/recipes/rec-001/edit')

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /title/i })).toHaveValue('Spaghetti Bolognese')
      })

      const publishButton = screen.getByRole('button', { name: /^publish$/i })
      expect(publishButton).toBeDisabled()

      const describedBy = publishButton.getAttribute('aria-describedby')
      const missingList = document.getElementById(describedBy as string)
      expect(missingList?.textContent ?? '').toMatch(/step 1 image still processing/i)
    })

    it('enables Publish once every image on the loaded recipe has processedAt (AC 1, 3)', async () => {
      // Recipe loaded with cover + step image both carrying processedAt.
      // If recipeToFormState does not hydrate processedAt, the gate will
      // misidentify the images as unready and Publish will stay disabled.
      vi.mocked(fetchMyRecipes).mockResolvedValue([recipeFullyReady])
      vi.mocked(fetchAllRecipes).mockResolvedValue([recipeFullyReady])

      renderEditor('/admin/recipes/rec-001/edit')

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /title/i })).toHaveValue('Spaghetti Bolognese')
      })

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^publish$/i })).not.toBeDisabled()
      })
    })

    it('flips the publish gate when onReady reports the matching key is ready (AC 4, 1, 5)', async () => {
      vi.mocked(fetchMyRecipes).mockResolvedValue([recipeWithUnreadyCover])
      vi.mocked(fetchAllRecipes).mockResolvedValue([recipeWithUnreadyCover])

      renderEditor('/admin/recipes/rec-001/edit')

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /title/i })).toHaveValue('Spaghetti Bolognese')
      })

      const publishButton = screen.getByRole('button', { name: /^publish$/i })
      expect(publishButton).toBeDisabled()

      // Simulate the poll hook finding the cover image is ready.
      pollControls.triggerReady([
        { imageType: 'cover', processedAt: 1_700_000_500_000 },
      ])

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^publish$/i })).not.toBeDisabled()
      })

      // The missing-fields list should no longer mention the cover image.
      const describedBy = screen
        .getByRole('button', { name: /^publish$/i })
        .getAttribute('aria-describedby')
      if (describedBy) {
        const missingList = document.getElementById(describedBy)
        expect(missingList?.textContent ?? '').not.toMatch(/cover image still processing/i)
      }

      // The editor should have announced "Image ready" via the page-level
      // aria-live="polite" region.
      await waitFor(() => {
        const statusRegions = screen.getAllByRole('status')
        const match = statusRegions.find(
          (region) =>
            region.getAttribute('aria-live') === 'polite' &&
            /image ready/i.test(region.textContent ?? '')
        )
        expect(match).toBeDefined()
      })
    })

    it('ignores IMAGE_STATUS_UPDATE entries whose imageType does not match any image on the form (AC 1)', async () => {
      vi.mocked(fetchMyRecipes).mockResolvedValue([recipeWithUnreadyCover])
      vi.mocked(fetchAllRecipes).mockResolvedValue([recipeWithUnreadyCover])

      renderEditor('/admin/recipes/rec-001/edit')

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /title/i })).toHaveValue('Spaghetti Bolognese')
      })

      expect(screen.getByRole('button', { name: /^publish$/i })).toBeDisabled()

      // Readiness update for a step imageType that does not exist on the form.
      pollControls.triggerReady([
        {
          imageType: 'step-99999999-9999-4999-8999-999999999999',
          processedAt: 1_700_000_500_000,
        },
      ])

      // A micro-task flush to let any reducer dispatch settle.
      await Promise.resolve()

      // Cover image still has no processedAt → Publish must remain disabled,
      // and the missing-fields list must still include the cover reason.
      const publishButton = screen.getByRole('button', { name: /^publish$/i })
      expect(publishButton).toBeDisabled()
      const describedBy = publishButton.getAttribute('aria-describedby')
      const missingList = document.getElementById(describedBy as string)
      expect(missingList?.textContent ?? '').toMatch(/cover image/i)
    })

    it('does not mark the form dirty on IMAGE_STATUS_UPDATE (AC 2)', async () => {
      vi.mocked(fetchMyRecipes).mockResolvedValue([recipeWithUnreadyCover])
      vi.mocked(fetchAllRecipes).mockResolvedValue([recipeWithUnreadyCover])

      renderEditor('/admin/recipes/rec-001/edit')

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /title/i })).toHaveValue('Spaghetti Bolognese')
      })

      // After the recipe has loaded, the form is pristine.
      await waitFor(() => {
        expect(autosaveControls.lastArgs.state?.dirty).toBe(false)
      })

      // Fire a readiness update.
      pollControls.triggerReady([
        { imageType: 'cover', processedAt: 1_700_000_500_000 },
      ])

      // The most recent autosave snapshot must still have dirty === false —
      // otherwise useAutosave's dirty-gate would fire a PATCH for a
      // server-originated readiness change, which is wrong.
      await waitFor(() => {
        expect(autosaveControls.lastArgs.state?.dirty).toBe(false)
      })
    })

    // Regression (#201): a recipe with no cover image must NOT be handed to the
    // poll hook as an unready cover. The editor marks the cover absent so the
    // hook never phantom-polls it and the "taking longer than expected" banner
    // never appears for a coverless draft.
    it('marks the cover absent for a recipe with no processed cover and no in-session upload', async () => {
      vi.mocked(fetchMyRecipes).mockResolvedValue([recipeWithUnreadyCover])
      vi.mocked(fetchAllRecipes).mockResolvedValue([recipeWithUnreadyCover])

      renderEditor('/admin/recipes/rec-001/edit')

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /title/i })).toHaveValue('Spaghetti Bolognese')
      })

      await waitFor(() => {
        expect(pollControls.lastArgs.recipe?.coverImage.processedAt).toBeUndefined()
      })
      // The cover is encoded as absent → the real hook would skip it entirely.
      expect(pollControls.lastArgs.recipe?.coverImage.absent).toBe(true)
      // And no false timeout banner is shown.
      expect(
        screen.queryByText(/processing is taking longer than expected/i)
      ).not.toBeInTheDocument()
    })

    // Regression (#201): once a cover upload starts this session, the cover IS a
    // real poll target even before processedAt arrives — so it must NOT be marked
    // absent, otherwise an uploaded-but-processing cover would never be polled.
    it('keeps the cover pollable (not absent) once a cover upload starts this session', async () => {
      vi.mocked(fetchMyRecipes).mockResolvedValue([recipeWithUnreadyCover])
      vi.mocked(fetchAllRecipes).mockResolvedValue([recipeWithUnreadyCover])

      const user = userEvent.setup()
      renderEditor('/admin/recipes/rec-001/edit')

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /title/i })).toHaveValue('Spaghetti Bolognese')
      })

      // Initially absent (no processed cover, no upload yet).
      await waitFor(() => {
        expect(pollControls.lastArgs.recipe?.coverImage.absent).toBe(true)
      })

      // Fire the cover upload-started callback through the ImageUpload stub.
      await user.click(screen.getByRole('button', { name: /start upload cover image/i }))

      // Now the cover is a live poll target — no longer marked absent, still no
      // processedAt (it is processing). The real hook polls it until ready.
      await waitFor(() => {
        expect(pollControls.lastArgs.recipe?.coverImage.absent).not.toBe(true)
      })
      expect(pollControls.lastArgs.recipe?.coverImage.processedAt).toBeUndefined()
    })

    it('renders the timeout banner when the poll hook reports timedOut: true (AC 8)', async () => {
      vi.mocked(fetchMyRecipes).mockResolvedValue([recipeWithUnreadyCover])
      vi.mocked(fetchAllRecipes).mockResolvedValue([recipeWithUnreadyCover])

      renderEditor('/admin/recipes/rec-001/edit')

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /title/i })).toHaveValue('Spaghetti Bolognese')
      })

      // Banner must not be present yet.
      expect(
        screen.queryByText(/processing is taking longer than expected/i)
      ).not.toBeInTheDocument()

      // Flip the hook into the timed-out state.
      pollControls.setTimedOut(true)

      await waitFor(() => {
        expect(
          screen.getByText(
            /processing is taking longer than expected — try refreshing the page\./i
          )
        ).toBeInTheDocument()
      })

      // The banner must be exposed via role="status" + aria-live="polite".
      const statusRegions = screen.getAllByRole('status')
      const banner = statusRegions.find(
        (region) =>
          region.getAttribute('aria-live') === 'polite' &&
          /processing is taking longer than expected/i.test(region.textContent ?? '')
      )
      expect(banner).toBeDefined()
    })
  })

  describe('slug input (#198)', () => {
    it('renders a Slug input reachable via its label', async () => {
      renderEditor('/admin/recipes/new')

      await waitFor(() => {
        expect(createDraft).toHaveBeenCalled()
      })

      expect(screen.getByLabelText('Slug')).toBeInTheDocument()
    })

    it('auto-fills the slug as sluggify(title) while typing the title', async () => {
      const user = userEvent.setup()
      renderEditor('/admin/recipes/new')

      await waitFor(() => {
        expect(createDraft).toHaveBeenCalled()
      })

      await user.type(screen.getByRole('textbox', { name: /title/i }), 'Beans on Toast')

      await waitFor(() => {
        expect(screen.getByLabelText('Slug')).toHaveValue('beans-on-toast')
      })
    })

    it('stops auto-filling after the user edits the slug directly', async () => {
      const user = userEvent.setup()
      renderEditor('/admin/recipes/new')

      await waitFor(() => {
        expect(createDraft).toHaveBeenCalled()
      })

      await user.type(screen.getByRole('textbox', { name: /title/i }), 'Beans on Toast')
      await waitFor(() => {
        expect(screen.getByLabelText('Slug')).toHaveValue('beans-on-toast')
      })

      // User overrides the slug.
      const slugInput = screen.getByLabelText('Slug')
      await user.clear(slugInput)
      await user.type(slugInput, 'bot')

      // Further title edits must NOT touch the slug.
      await user.type(screen.getByRole('textbox', { name: /title/i }), ' Deluxe')

      expect(screen.getByLabelText('Slug')).toHaveValue('bot')
    })

    it('"Reset to title slug" re-derives the slug from the title and re-enables auto-fill', async () => {
      const user = userEvent.setup()
      renderEditor('/admin/recipes/new')

      await waitFor(() => {
        expect(createDraft).toHaveBeenCalled()
      })

      await user.type(screen.getByRole('textbox', { name: /title/i }), 'Beans on Toast')
      const slugInput = screen.getByLabelText('Slug')
      await user.clear(slugInput)
      await user.type(slugInput, 'bot')

      await user.click(screen.getByRole('button', { name: /reset to title slug/i }))

      await waitFor(() => {
        expect(screen.getByLabelText('Slug')).toHaveValue('beans-on-toast')
      })

      // Auto-fill is re-enabled: a further title edit updates the slug again.
      await user.type(screen.getByRole('textbox', { name: /title/i }), ' Deluxe')
      await waitFor(() => {
        expect(screen.getByLabelText('Slug')).toHaveValue('beans-on-toast-deluxe')
      })
    })

    it('renders a live URL preview containing akli.dev/recipes/<slug>', async () => {
      const user = userEvent.setup()
      renderEditor('/admin/recipes/new')

      await waitFor(() => {
        expect(createDraft).toHaveBeenCalled()
      })

      await user.type(screen.getByRole('textbox', { name: /title/i }), 'Beans on Toast')

      await waitFor(() => {
        expect(screen.getByText(/akli\.dev\/recipes\/beans-on-toast/i)).toBeInTheDocument()
      })
    })

    it('locks the slug input (readOnly + aria-disabled) with a hint when the cover image is processed', async () => {
      vi.mocked(fetchMyRecipes).mockResolvedValue([draftRecipe])
      vi.mocked(fetchAllRecipes).mockResolvedValue([draftRecipe])

      renderEditor('/admin/recipes/rec-001/edit')

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /title/i })).toHaveValue('Spaghetti Bolognese')
      })

      const slugInput = screen.getByLabelText('Slug')
      // draftRecipe's cover has processedAt → slug is locked.
      expect(slugInput).toHaveAttribute('readonly')
      expect(slugInput).toHaveAttribute('aria-disabled', 'true')

      // A visible lock hint is shown, and the reset button is hidden.
      expect(screen.getByText(/slug is locked/i)).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /reset to title slug/i })).not.toBeInTheDocument()
    })

    it('locks the slug input while an image upload is in flight (uploadingStepIds / cover)', async () => {
      const user = userEvent.setup()
      // Use a fresh draft whose cover is NOT yet processed so the only lock
      // source is the in-flight upload signal.
      renderEditor('/admin/recipes/new')

      await waitFor(() => {
        expect(createDraft).toHaveBeenCalled()
      })

      // Not locked initially.
      expect(screen.getByLabelText('Slug')).not.toHaveAttribute('readonly')

      // Fire the cover upload-started callback through the ImageUpload stub.
      await user.click(screen.getByRole('button', { name: /start upload cover image/i }))

      await waitFor(() => {
        expect(screen.getByLabelText('Slug')).toHaveAttribute('aria-disabled', 'true')
      })
      expect(screen.getByLabelText('Slug')).toHaveAttribute('readonly')

      // Completing the upload clears the in-flight lock.
      await user.click(screen.getByRole('button', { name: /complete upload cover image/i }))

      await waitFor(() => {
        expect(screen.getByLabelText('Slug')).not.toHaveAttribute('readonly')
      })
    })

    it('disables Publish when the slug fails the validation regex', async () => {
      const user = userEvent.setup()
      renderEditor('/admin/recipes/new')

      await waitFor(() => {
        expect(createDraft).toHaveBeenCalled()
      })

      await fillAllRequired(user)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /publish/i })).not.toBeDisabled()
      })

      // Type an invalid slug (leading hyphen fails ^[a-z0-9]...).
      const slugInput = screen.getByLabelText('Slug')
      await user.clear(slugInput)
      await user.type(slugInput, '-bad-slug')

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /publish/i })).toBeDisabled()
      })
    })

    it('renders an inline error with the server message on 409 slug_taken', async () => {
      vi.mocked(fetchMyRecipes).mockResolvedValue([publishedRecipe])
      vi.mocked(fetchAllRecipes).mockResolvedValue([publishedRecipe])
      vi.mocked(updateRecipe).mockRejectedValue(
        new Error('409 Slug "spaghetti-bolognese" is already in use')
      )

      const user = userEvent.setup()
      renderEditor('/admin/recipes/rec-001/edit')

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /update/i }))

      // The server's slug_taken message is surfaced INLINE, associated with the
      // slug field via aria-describedby (not merely as a transient toast).
      await waitFor(() => {
        const slugInput = screen.getByLabelText('Slug')
        const describedBy = slugInput.getAttribute('aria-describedby') ?? ''
        const describerText = describedBy
          .split(/\s+/)
          .filter(Boolean)
          .map((id) => document.getElementById(id)?.textContent ?? '')
          .join(' ')
        expect(describerText).toMatch(/already in use/i)
      })
    })

    it('a fresh draft stays pristine (no autosave PATCH) until the user types', async () => {
      renderEditor('/admin/recipes/new')

      await waitFor(() => {
        expect(createDraft).toHaveBeenCalled()
      })

      // After LOAD_RECIPE from the created draft, the auto-derived slug must not
      // mark the form dirty.
      await waitFor(() => {
        expect(autosaveControls.lastArgs.state).not.toBeNull()
      })
      expect(autosaveControls.lastArgs.state?.dirty).toBe(false)
    })

    it('persists the edited slug — Update PATCH payload includes the edited valid slug', async () => {
      // Use a published recipe whose slug is unlocked (no processed cover) so
      // the slug input is editable and the Update button drives buildPatchPayload.
      const unlockedPublished: Recipe = {
        ...publishedRecipe,
        coverImage: { alt: 'Spaghetti bolognese' },
      }
      vi.mocked(fetchMyRecipes).mockResolvedValue([unlockedPublished])
      vi.mocked(fetchAllRecipes).mockResolvedValue([unlockedPublished])

      const user = userEvent.setup()
      renderEditor('/admin/recipes/rec-001/edit')

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /title/i })).toHaveValue('Spaghetti Bolognese')
      })

      const slugInput = screen.getByLabelText('Slug')
      await user.clear(slugInput)
      await user.type(slugInput, 'spaghetti-supreme')

      await user.click(screen.getByRole('button', { name: /update/i }))

      await waitFor(() => {
        expect(updateRecipe).toHaveBeenCalledWith(
          'token-123',
          'rec-001',
          expect.objectContaining({ slug: 'spaghetti-supreme' })
        )
      })
    })

    it('omits slug from the Update PATCH payload when the slug is invalid (rest still saves)', async () => {
      const unlockedPublished: Recipe = {
        ...publishedRecipe,
        coverImage: { alt: 'Spaghetti bolognese' },
      }
      vi.mocked(fetchMyRecipes).mockResolvedValue([unlockedPublished])
      vi.mocked(fetchAllRecipes).mockResolvedValue([unlockedPublished])

      const user = userEvent.setup()
      renderEditor('/admin/recipes/rec-001/edit')

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /title/i })).toHaveValue('Spaghetti Bolognese')
      })

      const slugInput = screen.getByLabelText('Slug')
      await user.clear(slugInput)
      await user.type(slugInput, 'Bad Slug!')

      await user.click(screen.getByRole('button', { name: /update/i }))

      await waitFor(() => {
        expect(updateRecipe).toHaveBeenCalled()
      })

      const payload = vi.mocked(updateRecipe).mock.calls.at(-1)?.[2] ?? {}
      expect(payload).not.toHaveProperty('slug')
      // The rest of the form still saves.
      expect(payload).toEqual(expect.objectContaining({ title: 'Spaghetti Bolognese' }))
    })
  })

  describe('step lifecycle stepId (#198)', () => {
    it('assigns a crypto.randomUUID stepId to a newly added step', async () => {
      const uuid = '33333333-3333-4333-8333-333333333333'
      vi.spyOn(crypto, 'randomUUID').mockReturnValue(uuid)

      const user = userEvent.setup()
      renderEditor('/admin/recipes/rec-001/edit')

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /title/i })).toHaveValue('Spaghetti Bolognese')
      })

      await user.click(screen.getByRole('button', { name: /add step/i }))

      // The newly added step's stepId is surfaced through the step ImageUpload stub.
      await waitFor(() => {
        const imageTypes = screen
          .getAllByTestId('image-upload-imagetype-step')
          .map((el) => el.textContent)
        expect(imageTypes).toContain(`step-${uuid}`)
      })
    })

    it('reordering steps preserves each step stepId (only order changes)', async () => {
      const stepA = '11111111-1111-4111-8111-111111111111'
      const stepB = '22222222-2222-4222-8222-222222222222'
      const twoStepRecipe: Recipe = {
        ...draftRecipe,
        steps: [
          { stepId: stepA, order: 1, text: 'First step' },
          { stepId: stepB, order: 2, text: 'Second step' },
        ],
      }
      vi.mocked(fetchMyRecipes).mockResolvedValue([twoStepRecipe])
      vi.mocked(fetchAllRecipes).mockResolvedValue([twoStepRecipe])

      const user = userEvent.setup()
      renderEditor('/admin/recipes/rec-001/edit')

      await waitFor(() => {
        expect(screen.getByLabelText('Step 1 text')).toHaveValue('First step')
      })

      await user.click(screen.getAllByRole('button', { name: /move down step 1/i })[0])

      // The text order flipped, but the stepIds travelled with their content:
      // the step-1 imageType now reflects stepB (originally second).
      await waitFor(() => {
        expect(screen.getByLabelText('Step 1 text')).toHaveValue('Second step')
      })

      const stepImageTypes = screen
        .getAllByTestId('image-upload-imagetype-step')
        .map((el) => el.textContent)
      expect(stepImageTypes).toEqual([`step-${stepB}`, `step-${stepA}`])
    })
  })
})

// Suppress unused-import lint — useAutosave is referenced in types only.
void useAutosave
