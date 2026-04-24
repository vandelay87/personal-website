import { fetchRecipeByIdAdmin, publishRecipe } from '@api/recipes'
import { useAuth } from '@contexts/AuthContext'
import type {
  ImageReadyUpdate,
  UseImageProcessingPollResult,
} from '@hooks/useImageProcessingPoll'
import type { Recipe } from '@models/recipe'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import RecipePreview from './RecipePreview'

vi.mock('@api/recipes', () => ({
  fetchRecipeByIdAdmin: vi.fn(),
  publishRecipe: vi.fn(),
}))

vi.mock('@contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

// Spy on useImageProcessingPoll so tests can:
// - capture the onReady callback and invoke it to simulate a ready image
// - toggle `timedOut` if relevant
// The real hook talks to the network and to auth/navigation — a mock is the
// only boundary that keeps the preview tests pure DOM assertions.
interface PollMockControls {
  lastArgs: {
    recipe: Recipe | null
    onReady: ((updates: ImageReadyUpdate[]) => void) | null
  }
  callCount: number
  setTimedOut: (next: boolean) => void
  triggerReady: (updates: ImageReadyUpdate[]) => void
}

const pollControls: PollMockControls = {
  lastArgs: { recipe: null, onReady: null },
  callCount: 0,
  setTimedOut: () => {},
  triggerReady: () => {},
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

const mockDraftRecipe: Recipe = {
  id: 'rec-draft',
  title: 'Draft Lemon Tart',
  slug: 'draft-lemon-tart',
  coverImage: {
    key: 'recipes/rec-draft/cover',
    alt: 'Lemon tart cover',
    // Default the shared fixture to "already processed" so the existing
    // banner / publish-flow tests render the ready branch. Tests that need
    // the unready branch override coverImage explicitly.
    processedAt: 1_700_000_000_000,
  },
  tags: ['Baking', 'Dessert'],
  prepTime: 20,
  cookTime: 35,
  servings: 6,
  createdAt: '2026-04-01T10:00:00Z',
  updatedAt: '2026-04-02T10:00:00Z',
  intro: 'A zesty lemon tart with a buttery shortcrust base.',
  ingredients: [
    { item: 'plain flour', quantity: '200', unit: 'g' },
    { item: 'unsalted butter', quantity: '100', unit: 'g' },
  ],
  steps: [
    { order: 1, text: 'Rub butter into the flour' },
    { order: 2, text: 'Bake the shell blind for 15 minutes' },
  ],
  authorId: 'user-1',
  authorName: 'Akli',
  status: 'draft',
}

const mockPublishedRecipe: Recipe = {
  ...mockDraftRecipe,
  id: 'rec-published',
  title: 'Published Thai Green Curry',
  slug: 'published-thai-green-curry',
  intro: 'A fragrant and creamy Thai green curry.',
  status: 'published',
}

const renderPreview = (id: string) =>
  render(
    <MemoryRouter initialEntries={[`/admin/recipes/${id}/preview`]}>
      <Routes>
        <Route path="/admin/recipes/:id/preview" element={<RecipePreview />} />
      </Routes>
    </MemoryRouter>
  )

describe('RecipePreview page', () => {
  beforeEach(() => {
    vi.resetAllMocks()
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
    vi.mocked(fetchRecipeByIdAdmin).mockResolvedValue(mockDraftRecipe)
    vi.mocked(publishRecipe).mockResolvedValue(mockPublishedRecipe)
  })

  // AC1 — renders the recipe using the same display components as the public
  // recipe detail page (title, ingredients, steps, intro).
  it('renders the recipe title, intro, ingredients and steps', async () => {
    renderPreview('rec-draft')

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: 'Draft Lemon Tart' })
      ).toBeInTheDocument()
    })

    expect(
      screen.getByText(/zesty lemon tart with a buttery shortcrust base/i)
    ).toBeInTheDocument()
    expect(screen.getByText(/plain flour/i)).toBeInTheDocument()
    expect(screen.getByText(/unsalted butter/i)).toBeInTheDocument()
    expect(screen.getByText('Rub butter into the flour')).toBeInTheDocument()
    expect(
      screen.getByText('Bake the shell blind for 15 minutes')
    ).toBeInTheDocument()
  })

  // AC2 — Draft recipes show the draft banner with Edit and Publish controls.
  it('shows the draft banner with Edit and Publish buttons for a draft recipe', async () => {
    renderPreview('rec-draft')

    await waitFor(() => {
      expect(
        screen.getByText(/preview\s*[—-]\s*this recipe is not yet published/i)
      ).toBeInTheDocument()
    })

    const editLink = screen.getByRole('link', { name: /edit/i })
    expect(editLink).toHaveAttribute(
      'href',
      '/admin/recipes/rec-draft/edit'
    )

    const publishButton = screen.getByRole('button', { name: /publish/i })
    expect(publishButton).toBeInTheDocument()
  })

  it('calls publishRecipe when the draft banner Publish button is clicked', async () => {
    const user = userEvent.setup()
    renderPreview('rec-draft')

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /publish/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /publish/i }))

    await waitFor(() => {
      expect(publishRecipe).toHaveBeenCalledWith('token-123', 'rec-draft')
    })
  })

  // AC3 — Published recipes show the published banner with Edit and a link
  // to the public page at /recipes/<slug>.
  it('shows the published banner with Edit and a link to the public page for a published recipe', async () => {
    vi.mocked(fetchRecipeByIdAdmin).mockResolvedValue(mockPublishedRecipe)
    renderPreview('rec-published')

    await waitFor(() => {
      expect(
        screen.getByText(/this recipe is published/i)
      ).toBeInTheDocument()
    })

    const editLink = screen.getByRole('link', { name: /edit/i })
    expect(editLink).toHaveAttribute(
      'href',
      '/admin/recipes/rec-published/edit'
    )

    // The public-page link points at /recipes/<slug>. We look it up by href
    // to avoid over-constraining the link text (could be "View on site",
    // "View public page", etc.).
    const links = screen.getAllByRole('link')
    const publicLink = links.find(
      (link) =>
        link.getAttribute('href') === '/recipes/published-thai-green-curry'
    )
    expect(publicLink).toBeDefined()
  })

  it('does not show a Publish button for an already-published recipe', async () => {
    vi.mocked(fetchRecipeByIdAdmin).mockResolvedValue(mockPublishedRecipe)
    renderPreview('rec-published')

    await waitFor(() => {
      expect(screen.getByText(/this recipe is published/i)).toBeInTheDocument()
    })

    expect(
      screen.queryByRole('button', { name: /^publish$/i })
    ).not.toBeInTheDocument()
  })

  // Supporting — loading state while the fetch is pending.
  it('shows a loading indicator while the recipe is being fetched', () => {
    vi.mocked(fetchRecipeByIdAdmin).mockReturnValue(new Promise(() => {}))
    renderPreview('rec-draft')

    expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument()
  })

  // Supporting — not-found path when the server 404s.
  it('shows a not-found message when the server returns 404', async () => {
    vi.mocked(fetchRecipeByIdAdmin).mockRejectedValue(
      new Error('404 Not Found')
    )
    renderPreview('rec-missing')

    await waitFor(() => {
      expect(screen.getByText(/not found/i)).toBeInTheDocument()
    })
  })

  // ---- Issue #173 — fetch swap + polling wiring ------------------------

  // AC1 — Fetches via fetchRecipeByIdAdmin(token, id) on mount.
  describe('fetch on mount (issue #173)', () => {
    it('calls fetchRecipeByIdAdmin(token, id) on mount', async () => {
      renderPreview('rec-draft')

      await waitFor(() => {
        expect(fetchRecipeByIdAdmin).toHaveBeenCalledWith(
          'token-123',
          'rec-draft',
          expect.anything()
        )
      })
    })

    it('renders the loaded recipe title once fetchRecipeByIdAdmin resolves', async () => {
      renderPreview('rec-draft')

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { level: 1, name: 'Draft Lemon Tart' })
        ).toBeInTheDocument()
      })
    })
  })

  // AC2 — Uses useImageProcessingPoll on the loaded recipe with an onReady
  // callback that merges readiness into local state by key.
  describe('useImageProcessingPoll wiring (issue #173)', () => {
    it('invokes useImageProcessingPoll with the loaded recipe once fetch resolves', async () => {
      renderPreview('rec-draft')

      await waitFor(() => {
        expect(pollControls.lastArgs.recipe).not.toBeNull()
      })

      expect(pollControls.lastArgs.recipe?.id).toBe('rec-draft')
      expect(pollControls.lastArgs.recipe?.coverImage.key).toBe(
        'recipes/rec-draft/cover'
      )
      expect(typeof pollControls.lastArgs.onReady).toBe('function')
    })

    it('renders ProcessingPlaceholder while the cover image is still processing', async () => {
      const recipeWithUnreadyCover: Recipe = {
        ...mockDraftRecipe,
        coverImage: {
          key: 'recipes/rec-draft/cover',
          alt: 'Lemon tart cover',
          // processedAt absent — cover is still processing.
        },
      }
      vi.mocked(fetchRecipeByIdAdmin).mockResolvedValue(recipeWithUnreadyCover)

      renderPreview('rec-draft')

      // Wait for the page to finish loading and render the banner.
      await waitFor(() => {
        expect(
          screen.getByText(/preview\s*[—-]\s*this recipe is not yet published/i)
        ).toBeInTheDocument()
      })

      // Placeholder visible, no cover <img>.
      expect(screen.getByText(/processing image…/i)).toBeInTheDocument()
      expect(
        screen.queryByRole('img', { name: /lemon tart cover/i })
      ).not.toBeInTheDocument()
    })

    it('auto-updates the preview when onReady fires with the matching cover key (processing → ready)', async () => {
      const recipeWithUnreadyCover: Recipe = {
        ...mockDraftRecipe,
        coverImage: {
          key: 'recipes/rec-draft/cover',
          alt: 'Lemon tart cover',
        },
      }
      vi.mocked(fetchRecipeByIdAdmin).mockResolvedValue(recipeWithUnreadyCover)

      renderPreview('rec-draft')

      await waitFor(() => {
        expect(screen.getByText(/processing image…/i)).toBeInTheDocument()
      })

      // Initially the cover is a placeholder.
      expect(
        screen.queryByRole('img', { name: /lemon tart cover/i })
      ).not.toBeInTheDocument()

      // Poll hook reports the cover is ready.
      pollControls.triggerReady([
        { key: 'recipes/rec-draft/cover', processedAt: 1_700_000_500_000 },
      ])

      // Placeholder gone, cover <img> now rendered.
      await waitFor(() => {
        expect(
          screen.getByRole('img', { name: /lemon tart cover/i })
        ).toBeInTheDocument()
      })
      expect(screen.queryByText(/processing image…/i)).not.toBeInTheDocument()
    })

    it('ignores readiness updates whose keys do not match any image on the recipe', async () => {
      const recipeWithUnreadyCover: Recipe = {
        ...mockDraftRecipe,
        coverImage: {
          key: 'recipes/rec-draft/cover',
          alt: 'Lemon tart cover',
        },
      }
      vi.mocked(fetchRecipeByIdAdmin).mockResolvedValue(recipeWithUnreadyCover)

      renderPreview('rec-draft')

      await waitFor(() => {
        expect(screen.getByText(/processing image…/i)).toBeInTheDocument()
      })

      // Fire a readiness update for a key that does not exist on the recipe.
      pollControls.triggerReady([
        { key: 'recipes/rec-draft/some-other-key', processedAt: 1_700_000_500_000 },
      ])

      // Let any state updates flush.
      await Promise.resolve()
      await Promise.resolve()

      // Placeholder must still be visible, no cover <img>.
      expect(screen.getByText(/processing image…/i)).toBeInTheDocument()
      expect(
        screen.queryByRole('img', { name: /lemon tart cover/i })
      ).not.toBeInTheDocument()
    })

    it('auto-updates a step image placeholder when onReady fires with the step image key', async () => {
      const recipeWithUnreadyStep: Recipe = {
        ...mockDraftRecipe,
        // Cover image ready so we isolate the step placeholder.
        coverImage: {
          key: 'recipes/rec-draft/cover',
          alt: 'Lemon tart cover',
          processedAt: 1_700_000_000_000,
        },
        steps: [
          {
            order: 1,
            text: 'Rub butter into the flour',
            image: {
              key: 'recipes/rec-draft/step-1',
              alt: 'Rubbed butter into flour',
            },
          },
        ],
      }
      vi.mocked(fetchRecipeByIdAdmin).mockResolvedValue(recipeWithUnreadyStep)

      renderPreview('rec-draft')

      await waitFor(() => {
        expect(screen.getByText(/processing image…/i)).toBeInTheDocument()
      })

      // Step image placeholder is visible; its <img> is not.
      expect(
        screen.queryByRole('img', { name: /rubbed butter into flour/i })
      ).not.toBeInTheDocument()

      // Poll hook reports the step image is ready.
      pollControls.triggerReady([
        { key: 'recipes/rec-draft/step-1', processedAt: 1_700_000_600_000 },
      ])

      await waitFor(() => {
        expect(
          screen.getByRole('img', { name: /rubbed butter into flour/i })
        ).toBeInTheDocument()
      })
      expect(screen.queryByText(/processing image…/i)).not.toBeInTheDocument()
    })
  })
})
