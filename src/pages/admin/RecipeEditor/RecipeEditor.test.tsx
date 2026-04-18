import { createRecipe, fetchMyRecipes, fetchTags, updateRecipe } from '@api/recipes'
import { useAuth } from '@contexts/AuthContext'
import type { Recipe } from '@models/recipe'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { createMemoryRouter, Link, RouterProvider } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import RecipeEditor from './RecipeEditor'

vi.mock('@api/recipes', () => ({
  createRecipe: vi.fn(),
  updateRecipe: vi.fn(),
  fetchMyRecipes: vi.fn(),
  fetchTags: vi.fn(),
  getUploadUrl: vi.fn(),
}))

vi.mock('@contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

// Mocked so tests can trigger onUpload without driving a real file input
// through getUploadUrl + fetch.
vi.mock('@components/ImageUpload', () => ({
  default: ({
    onUpload,
    imageType = 'cover',
  }: {
    onUpload: (key: string) => void
    imageType?: 'cover' | 'step'
  }) => (
    <button type="button" onClick={() => onUpload(`recipes/test/${imageType}-stub`)}>
      Simulate upload {imageType} image
    </button>
  ),
}))

const fillValidCoverImage = async (user: UserEvent) => {
  await user.click(screen.getByRole('button', { name: /simulate upload cover image/i }))
  await user.type(screen.getByLabelText(/cover image alt text/i), 'Cover alt text')
}

const mockRecipe: Recipe = {
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

const renderEditor = (route = '/admin/recipes/new') => {
  const router = createMemoryRouter(
    [
      { path: '/admin/recipes/new', element: <RecipeEditor /> },
      { path: '/admin/recipes/:id/edit', element: <RecipeEditor /> },
    ],
    { initialEntries: [route] }
  )
  return render(<RouterProvider router={router} />)
}

describe('RecipeEditor page', () => {
  beforeEach(() => {
    vi.resetAllMocks()
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
    vi.mocked(fetchMyRecipes).mockResolvedValue([mockRecipe])
    vi.mocked(createRecipe).mockResolvedValue(mockRecipe)
    vi.mocked(updateRecipe).mockResolvedValue(mockRecipe)
  })

  it('renders empty form for create (/admin/recipes/new)', async () => {
    renderEditor('/admin/recipes/new')

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /title/i })).toBeInTheDocument()
    })

    expect(screen.getByRole('textbox', { name: /title/i })).toHaveValue('')
    expect(screen.getByRole('textbox', { name: /intro/i })).toHaveValue('')
    expect(screen.getByRole('button', { name: /save as draft/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /publish/i })).toBeInTheDocument()
  })

  it('populates form for edit (/admin/recipes/:id/edit)', async () => {
    renderEditor('/admin/recipes/rec-001/edit')

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /title/i })).toHaveValue('Spaghetti Bolognese')
    })

    expect(screen.getByRole('textbox', { name: /intro/i })).toHaveValue('A classic Italian dish.')
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
  })

  it('validates required fields — submit without title shows inline error on title', async () => {
    const user = userEvent.setup()
    renderEditor('/admin/recipes/new')

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /publish/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /publish/i }))

    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument()
    })
  })

  it('validates required intro', async () => {
    const user = userEvent.setup()
    renderEditor('/admin/recipes/new')

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /publish/i })).toBeInTheDocument()
    })

    const titleInput = screen.getByRole('textbox', { name: /title/i })
    await user.type(titleInput, 'My Recipe')
    await user.click(screen.getByRole('button', { name: /publish/i }))

    await waitFor(() => {
      expect(screen.getByText(/intro is required/i)).toBeInTheDocument()
    })
  })

  it('shows cover-image-required error when saving with no cover image', async () => {
    const user = userEvent.setup()
    renderEditor('/admin/recipes/new')

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save as draft/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /save as draft/i }))

    await waitFor(() => {
      expect(screen.getByText(/cover image is required/i)).toBeInTheDocument()
    })

    expect(createRecipe).not.toHaveBeenCalled()
  })

  it('shows alt-text-required error when saving with a cover image but no alt text', async () => {
    const recipeWithoutAlt: Recipe = {
      ...mockRecipe,
      coverImage: { key: 'recipes/rec-001/cover', alt: '' },
    }
    vi.mocked(fetchMyRecipes).mockResolvedValue([recipeWithoutAlt])

    const user = userEvent.setup()
    renderEditor('/admin/recipes/rec-001/edit')

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /title/i })).toHaveValue('Spaghetti Bolognese')
    })

    await user.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(screen.getByText(/alt text is required/i)).toBeInTheDocument()
    })

    expect(updateRecipe).not.toHaveBeenCalled()
  })

  it('editing the cover-image alt text updates the form value', async () => {
    const user = userEvent.setup()
    renderEditor('/admin/recipes/rec-001/edit')

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /title/i })).toHaveValue('Spaghetti Bolognese')
    })

    const altInput = screen.getByLabelText(/cover image alt text/i)
    await user.clear(altInput)
    await user.type(altInput, 'A steaming bowl of spaghetti bolognese')

    await user.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(updateRecipe).toHaveBeenCalledWith(
        'token-123',
        'rec-001',
        expect.objectContaining({
          coverImage: expect.objectContaining({
            alt: 'A steaming bowl of spaghetti bolognese',
          }),
        })
      )
    })
  })

  it('validates at least 1 ingredient with item filled', async () => {
    const user = userEvent.setup()
    renderEditor('/admin/recipes/new')

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /publish/i })).toBeInTheDocument()
    })

    const titleInput = screen.getByRole('textbox', { name: /title/i })
    const introInput = screen.getByRole('textbox', { name: /intro/i })
    await user.type(titleInput, 'My Recipe')
    await user.type(introInput, 'A great recipe')
    await user.click(screen.getByRole('button', { name: /publish/i }))

    await waitFor(() => {
      expect(screen.getByText(/at least one ingredient/i)).toBeInTheDocument()
    })
  })

  it('validates at least 1 step with text filled', async () => {
    const user = userEvent.setup()
    renderEditor('/admin/recipes/new')

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /publish/i })).toBeInTheDocument()
    })

    const titleInput = screen.getByRole('textbox', { name: /title/i })
    const introInput = screen.getByRole('textbox', { name: /intro/i })
    await user.type(titleInput, 'My Recipe')
    await user.type(introInput, 'A great recipe')

    // Fill in at least one ingredient item
    const ingredientInputs = screen.getAllByRole('textbox', { name: /item/i })
    await user.type(ingredientInputs[0], 'Flour')

    await user.click(screen.getByRole('button', { name: /publish/i }))

    await waitFor(() => {
      expect(screen.getByText(/at least one step/i)).toBeInTheDocument()
    })
  })

  it('"Save as draft" calls createRecipe with status: "draft"', async () => {
    const user = userEvent.setup()
    renderEditor('/admin/recipes/new')

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /title/i })).toBeInTheDocument()
    })

    const titleInput = screen.getByRole('textbox', { name: /title/i })
    const introInput = screen.getByRole('textbox', { name: /intro/i })
    await user.type(titleInput, 'My Recipe')
    await user.type(introInput, 'A great recipe')

    const ingredientInputs = screen.getAllByRole('textbox', { name: /item/i })
    await user.type(ingredientInputs[0], 'Flour')

    const stepTextareas = screen.getAllByRole('textbox', { name: /step.*text/i })
    await user.type(stepTextareas[0], 'Mix it all')

    await fillValidCoverImage(user)

    await user.click(screen.getByRole('button', { name: /save as draft/i }))

    await waitFor(() => {
      expect(createRecipe).toHaveBeenCalledWith(
        'token-123',
        expect.objectContaining({ status: 'draft' })
      )
    })
  })

  it('"Publish" calls createRecipe with status: "published"', async () => {
    const user = userEvent.setup()
    renderEditor('/admin/recipes/new')

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /title/i })).toBeInTheDocument()
    })

    const titleInput = screen.getByRole('textbox', { name: /title/i })
    const introInput = screen.getByRole('textbox', { name: /intro/i })
    await user.type(titleInput, 'My Recipe')
    await user.type(introInput, 'A great recipe')

    const ingredientInputs = screen.getAllByRole('textbox', { name: /item/i })
    await user.type(ingredientInputs[0], 'Flour')

    const stepTextareas = screen.getAllByRole('textbox', { name: /step.*text/i })
    await user.type(stepTextareas[0], 'Mix it all')

    await fillValidCoverImage(user)

    await user.click(screen.getByRole('button', { name: /publish/i }))

    await waitFor(() => {
      expect(createRecipe).toHaveBeenCalledWith(
        'token-123',
        expect.objectContaining({ status: 'published' })
      )
    })
  })

  it('"Save changes" (edit mode) calls updateRecipe preserving current status', async () => {
    const user = userEvent.setup()
    renderEditor('/admin/recipes/rec-001/edit')

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /title/i })).toHaveValue('Spaghetti Bolognese')
    })

    await user.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(updateRecipe).toHaveBeenCalledWith(
        'token-123',
        'rec-001',
        expect.objectContaining({ status: 'draft' })
      )
    })
  })

  it('shows success toast after save', async () => {
    const user = userEvent.setup()
    renderEditor('/admin/recipes/new')

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /title/i })).toBeInTheDocument()
    })

    const titleInput = screen.getByRole('textbox', { name: /title/i })
    const introInput = screen.getByRole('textbox', { name: /intro/i })
    await user.type(titleInput, 'My Recipe')
    await user.type(introInput, 'A great recipe')

    const ingredientInputs = screen.getAllByRole('textbox', { name: /item/i })
    await user.type(ingredientInputs[0], 'Flour')

    const stepTextareas = screen.getAllByRole('textbox', { name: /step.*text/i })
    await user.type(stepTextareas[0], 'Mix it all')

    await fillValidCoverImage(user)

    await user.click(screen.getByRole('button', { name: /save as draft/i }))

    await waitFor(() => {
      expect(screen.getByText(/recipe saved/i)).toBeInTheDocument()
    })
    expect(screen.getAllByRole('status').length).toBeGreaterThan(0)
  })

  it('shows error toast on API failure', async () => {
    vi.mocked(createRecipe).mockRejectedValue(new Error('500 Internal Server Error'))
    const user = userEvent.setup()
    renderEditor('/admin/recipes/new')

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /title/i })).toBeInTheDocument()
    })

    const titleInput = screen.getByRole('textbox', { name: /title/i })
    const introInput = screen.getByRole('textbox', { name: /intro/i })
    await user.type(titleInput, 'My Recipe')
    await user.type(introInput, 'A great recipe')

    const ingredientInputs = screen.getAllByRole('textbox', { name: /item/i })
    await user.type(ingredientInputs[0], 'Flour')

    const stepTextareas = screen.getAllByRole('textbox', { name: /step.*text/i })
    await user.type(stepTextareas[0], 'Mix it all')

    await fillValidCoverImage(user)

    await user.click(screen.getByRole('button', { name: /save as draft/i }))

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument()
    })
    expect(screen.getAllByRole('status').length).toBeGreaterThan(0)
  })

  it('tag input is wired into the editor — typing surfaces a suggestion and clicking it adds a chip', async () => {
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

  it('first invalid field is focused on validation failure', async () => {
    const user = userEvent.setup()
    renderEditor('/admin/recipes/new')

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /publish/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /publish/i }))

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /title/i })).toHaveFocus()
    })
  })

  describe('unsaved-changes confirmation', () => {
    it('does not prevent beforeunload when the form is pristine', async () => {
      renderEditor('/admin/recipes/new')

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /title/i })).toBeInTheDocument()
      })

      const event = new Event('beforeunload', { cancelable: true })
      window.dispatchEvent(event)

      expect(event.defaultPrevented).toBe(false)
    })

    it('prevents beforeunload once the user has made edits (dirty form)', async () => {
      const user = userEvent.setup()
      renderEditor('/admin/recipes/new')

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /title/i })).toBeInTheDocument()
      })

      await user.type(screen.getByRole('textbox', { name: /title/i }), 'My Recipe')

      const event = new Event('beforeunload', { cancelable: true })
      window.dispatchEvent(event)

      expect(event.defaultPrevented).toBe(true)
    })

    it('does not prevent beforeunload after a successful save (form becomes pristine)', async () => {
      const user = userEvent.setup()
      renderEditor('/admin/recipes/new')

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /title/i })).toBeInTheDocument()
      })

      await user.type(screen.getByRole('textbox', { name: /title/i }), 'My Recipe')
      await user.type(screen.getByRole('textbox', { name: /intro/i }), 'A great recipe')
      await user.type(screen.getAllByRole('textbox', { name: /item/i })[0], 'Flour')
      await user.type(screen.getAllByRole('textbox', { name: /step.*text/i })[0], 'Mix it all')

      await fillValidCoverImage(user)

      await user.click(screen.getByRole('button', { name: /save as draft/i }))

      await waitFor(() => {
        expect(createRecipe).toHaveBeenCalled()
      })

      const event = new Event('beforeunload', { cancelable: true })
      window.dispatchEvent(event)

      expect(event.defaultPrevented).toBe(false)
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
          { path: '/admin/recipes/new', element: <EditorWithBackLink /> },
          { path: '/admin/recipes', element: <div>Recipe list page</div> },
        ],
        { initialEntries: ['/admin/recipes/new'] }
      )

      render(<RouterProvider router={router} />)

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /title/i })).toBeInTheDocument()
      })

      await user.type(screen.getByRole('textbox', { name: /title/i }), 'My Recipe')

      await user.click(screen.getByRole('link', { name: /back to list/i }))

      const dialog = await screen.findByRole('dialog')
      expect(dialog).toBeInTheDocument()
      expect(within(dialog).getByText(/unsaved changes/i)).toBeInTheDocument()
      expect(screen.getByRole('textbox', { name: /title/i })).toBeInTheDocument()
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

    it('announces when an ingredient is reordered', async () => {
      const user = userEvent.setup()
      renderEditor('/admin/recipes/new')

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add ingredient/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /add ingredient/i }))

      const moveDownButtons = screen.getAllByRole('button', { name: /move down ingredient/i })
      await user.click(moveDownButtons[0])

      await waitFor(() => {
        expect(findLiveRegionWith(/ingredient.*moved/i)).toBeInTheDocument()
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

    it('announces when a step is removed', async () => {
      const user = userEvent.setup()
      renderEditor('/admin/recipes/new')

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add step/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /add step/i }))

      const removeButtons = screen.getAllByRole('button', { name: /remove step/i })
      await user.click(removeButtons[0])

      await waitFor(() => {
        expect(findLiveRegionWith(/step removed/i)).toBeInTheDocument()
      })
    })

    it('announces when a step is reordered', async () => {
      const user = userEvent.setup()
      renderEditor('/admin/recipes/new')

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add step/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /add step/i }))

      const moveDownButtons = screen.getAllByRole('button', { name: /move down step/i })
      await user.click(moveDownButtons[0])

      await waitFor(() => {
        expect(findLiveRegionWith(/step.*moved/i)).toBeInTheDocument()
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
      renderEditor('/admin/recipes/new')

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /title/i })).toBeInTheDocument()
      })

      const titleInput = screen.getByRole('textbox', { name: /title/i })
      const introInput = screen.getByRole('textbox', { name: /intro/i })
      await user.type(titleInput, 'My Recipe')
      await user.type(introInput, 'A great recipe')
      await user.type(screen.getAllByRole('textbox', { name: /item/i })[0], 'Flour')
      await user.type(screen.getAllByRole('textbox', { name: /step.*text/i })[0], 'Mix it all')

      await fillValidCoverImage(user)

      await user.click(screen.getByRole('button', { name: /save as draft/i }))

      await waitFor(() => {
        expect(
          screen.getByText(/session expired.*please log in again/i)
        ).toBeInTheDocument()
      })

      expect(screen.getByRole('textbox', { name: /title/i })).toHaveValue('My Recipe')
      expect(screen.getByRole('textbox', { name: /intro/i })).toHaveValue('A great recipe')
    })
  })
})
