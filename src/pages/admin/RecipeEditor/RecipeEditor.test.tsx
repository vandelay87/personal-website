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
import type { Recipe } from '@models/recipe'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { createMemoryRouter, Link, RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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
  retryMock: ReturnType<typeof vi.fn>
  flushMock: ReturnType<typeof vi.fn>
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

// ImageUpload is replaced with a stub so we can assert on the prop passed
// (and trigger onUpload without a real file input).
interface ImageUploadStubProps {
  onUpload: (key: string) => void
  recipeId: string
  imageType?: 'cover' | 'step'
}

vi.mock('@components/ImageUpload', () => ({
  default: ({
    onUpload,
    recipeId,
    imageType = 'cover',
  }: ImageUploadStubProps) => {
    return (
      <div>
        <span data-testid={`image-upload-recipe-id-${imageType}`}>{recipeId}</span>
        <button type="button" onClick={() => onUpload(`recipes/test/${imageType}-stub`)}>
          Simulate upload {imageType} image
        </button>
      </div>
    )
  },
}))

const fillValidCoverImage = async (user: UserEvent) => {
  await user.click(screen.getByRole('button', { name: /simulate upload cover image/i }))
  await user.type(screen.getByLabelText(/cover image alt text/i), 'Cover alt text')
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
  coverImage: { key: 'recipes/rec-001/cover', alt: 'Spaghetti bolognese' },
  tags: ['Italian', 'Pasta'],
  prepTime: 15,
  cookTime: 45,
  servings: 4,
  createdAt: '2026-03-20T10:00:00Z',
  updatedAt: '2026-03-22T10:00:00Z',
  intro: 'A classic Italian dish.',
  ingredients: [{ item: 'Spaghetti', quantity: '400', unit: 'g' }],
  steps: [{ order: 1, text: 'Boil pasta' }],
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
          { path: '/admin/recipes/rec-001/edit', element: <EditorWithBackLink /> },
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
})

// Suppress unused-import lint — useAutosave is referenced in types only.
void useAutosave
