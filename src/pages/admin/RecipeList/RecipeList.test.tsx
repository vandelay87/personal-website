import { deleteRecipe, fetchAllRecipes, publishRecipe, unpublishRecipe } from '@api/recipes'
import { useAuth } from '@contexts/AuthContext'
import { ToastProvider } from '@contexts/ToastContext'
import type { Recipe } from '@models/recipe'
import {
  act,
  fireEvent,
  render,
  screen,
  within,
  type RenderResult,
} from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'

import RecipeList from './RecipeList'

vi.mock('@api/recipes', () => ({
  fetchAllRecipes: vi.fn(),
  publishRecipe: vi.fn(),
  unpublishRecipe: vi.fn(),
  deleteRecipe: vi.fn(),
}))

vi.mock('@contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

const mockDraftRecipe: Recipe = {
  id: 'rec-001',
  title: 'Spaghetti Bolognese',
  slug: 'spaghetti-bolognese',
  coverImage: { alt: 'Spaghetti bolognese' },
  tags: ['Italian', 'Pasta'],
  prepTime: 15,
  cookTime: 45,
  servings: 4,
  createdAt: '2026-03-20T10:00:00Z',
  updatedAt: '2026-03-22T10:00:00Z',
  intro: 'A classic Italian dish.',
  ingredients: [],
  steps: [],
  authorId: 'user-1',
  authorName: 'Akli',
  status: 'draft',
}

const mockPublishedRecipe: Recipe = {
  id: 'rec-002',
  title: 'Thai Green Curry',
  slug: 'thai-green-curry',
  coverImage: { alt: 'Thai green curry' },
  tags: ['Thai', 'Spicy'],
  prepTime: 20,
  cookTime: 25,
  servings: 2,
  createdAt: '2026-03-18T10:00:00Z',
  updatedAt: '2026-03-19T10:00:00Z',
  intro: 'Fragrant and creamy.',
  ingredients: [],
  steps: [],
  authorId: 'user-1',
  authorName: 'Akli',
  status: 'published',
}

// RecipeList suspends on mount (Suspense + `use()`), so the initial render
// must be awaited inside an async act() — otherwise React defers the
// resolved commit indefinitely instead of applying it once the fetch
// settles. The same applies to any interaction (e.g. publish/delete) that
// triggers a refetch.
const renderRecipeList = async (): Promise<RenderResult> => {
  let result!: RenderResult
  await act(async () => {
    result = render(
      <MemoryRouter initialEntries={['/admin/recipes']}>
        <ToastProvider>
          <RecipeList />
        </ToastProvider>
      </MemoryRouter>
    )
  })
  return result
}

const renderRecipeListWithAccessDenied = async (): Promise<RenderResult> => {
  let result!: RenderResult
  await act(async () => {
    result = render(
      <MemoryRouter
        initialEntries={[{ pathname: '/admin/recipes', state: { accessDenied: true } }]}
      >
        <ToastProvider>
          <RecipeList />
        </ToastProvider>
      </MemoryRouter>
    )
  })
  return result
}

describe('Admin RecipeList page', () => {
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
    vi.mocked(fetchAllRecipes).mockResolvedValue([mockDraftRecipe, mockPublishedRecipe])
    vi.mocked(publishRecipe).mockResolvedValue(mockPublishedRecipe)
    vi.mocked(unpublishRecipe).mockResolvedValue(mockDraftRecipe)
    vi.mocked(deleteRecipe).mockResolvedValue(undefined)
  })

  it('renders recipe list with titles and status badges', async () => {
    await renderRecipeList()

    expect(screen.getByText('Spaghetti Bolognese')).toBeInTheDocument()
    expect(screen.getByText('Thai Green Curry')).toBeInTheDocument()
    expect(screen.getByText(/draft/i)).toBeInTheDocument()
    expect(screen.getByText(/published/i)).toBeInTheDocument()
  })

  it('shows action buttons per row', async () => {
    await renderRecipeList()

    const editButtons = screen.getAllByRole('link', { name: /edit/i })
    const previewButtons = screen.getAllByRole('link', { name: /preview/i })
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i })

    expect(editButtons).toHaveLength(2)
    expect(previewButtons).toHaveLength(2)
    expect(deleteButtons).toHaveLength(2)
  })

  it('has a new recipe button linking to /admin/recipes/new', async () => {
    await renderRecipeList()

    const newRecipeLink = screen.getByRole('link', { name: /new recipe/i })
    expect(newRecipeLink).toHaveAttribute('href', '/admin/recipes/new')
  })

  it('shows confirmation dialog when delete is clicked', async () => {
    await renderRecipeList()

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
    fireEvent.click(deleteButtons[0])

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('executes delete after confirmation', async () => {
    await renderRecipeList()

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
    fireEvent.click(deleteButtons[0])

    const confirmButton = screen.getByRole('button', { name: /confirm/i })
    // Deleting triggers a refresh, which remounts and refetches (suspends
    // again), so this click must be awaited inside act().
    await act(async () => {
      fireEvent.click(confirmButton)
    })

    expect(deleteRecipe).toHaveBeenCalledWith('token-123', 'rec-001')
  })

  it('shows Publish button for draft and Unpublish for published recipe', async () => {
    await renderRecipeList()

    const publishButton = screen.getByRole('button', { name: /^publish$/i })
    const unpublishButton = screen.getByRole('button', { name: /unpublish/i })

    expect(publishButton).toBeInTheDocument()
    expect(unpublishButton).toBeInTheDocument()

    // Publishing triggers a refresh, which remounts and refetches (suspends
    // again), so this click must be awaited inside act().
    await act(async () => {
      fireEvent.click(publishButton)
    })

    expect(publishRecipe).toHaveBeenCalledWith('token-123', 'rec-001')
  })

  it('clicking Unpublish on a published recipe calls unpublishRecipe', async () => {
    await renderRecipeList()

    const unpublishButton = screen.getByRole('button', { name: /unpublish/i })
    await act(async () => {
      fireEvent.click(unpublishButton)
    })

    expect(unpublishRecipe).toHaveBeenCalledWith('token-123', 'rec-002')
    expect(publishRecipe).not.toHaveBeenCalled()
  })

  it('shows empty state when no recipes exist', async () => {
    vi.mocked(fetchAllRecipes).mockResolvedValue([])
    await renderRecipeList()

    expect(screen.getByText(/no recipes yet/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /create/i })).toBeInTheDocument()
  })

  it('shows loading indicator while fetching', async () => {
    vi.mocked(fetchAllRecipes).mockReturnValue(new Promise(() => {}))
    await renderRecipeList()

    expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument()
  })

  it('shows error state with retry button when fetch fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(fetchAllRecipes).mockRejectedValue(new Error('500 Internal Server Error'))
    await renderRecipeList()

    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })

  it('retrying after an error re-fetches and shows the recipe list', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(fetchAllRecipes).mockRejectedValueOnce(new Error('500 Internal Server Error'))
    await renderRecipeList()

    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /retry/i }))
    })

    expect(screen.getByText('Spaghetti Bolognese')).toBeInTheDocument()
  })

  it('shows an "Access denied" toast when navigated here with accessDenied state', async () => {
    await renderRecipeListWithAccessDenied()

    // Toasts render as a dismissible button labelled with the message inside
    // the ToastProvider's aria-live region.
    const toast = await screen.findByRole('button', { name: /access denied/i })
    expect(toast).toBeInTheDocument()
  })

  it('calls fetchAllRecipes (not fetchMyRecipes) to load both draft and published recipes', async () => {
    await renderRecipeList()

    expect(fetchAllRecipes).toHaveBeenCalledWith('token-123')
  })

  it('renders rows sorted by updatedAt descending regardless of input order', async () => {
    const oldest: Recipe = {
      ...mockDraftRecipe,
      id: 'rec-oldest',
      title: 'Oldest',
      updatedAt: '2026-01-01T00:00:00Z',
      status: 'published',
    }
    const newest: Recipe = {
      ...mockDraftRecipe,
      id: 'rec-newest',
      title: 'Newest',
      updatedAt: '2026-04-19T00:00:00Z',
      status: 'draft',
    }
    const middle: Recipe = {
      ...mockDraftRecipe,
      id: 'rec-middle',
      title: 'Middle',
      updatedAt: '2026-02-15T00:00:00Z',
      status: 'published',
    }

    vi.mocked(fetchAllRecipes).mockResolvedValue([oldest, newest, middle])
    await renderRecipeList()

    // Row titles are the only level-2 headings on the page, so their DOM
    // order reflects the row order rendered by the list.
    const titles = screen
      .getAllByRole('heading', { level: 2 })
      .map((heading) => heading.textContent)

    expect(titles).toEqual(['Newest', 'Middle', 'Oldest'])
  })

  it('renders a status label matching each row in a mixed draft/published list', async () => {
    await renderRecipeList()

    const draftRow = screen.getByText('Spaghetti Bolognese').closest('li')
    const publishedRow = screen.getByText('Thai Green Curry').closest('li')

    expect(draftRow).not.toBeNull()
    expect(publishedRow).not.toBeNull()

    expect(within(draftRow as HTMLElement).getByText(/draft/i)).toBeInTheDocument()
    expect(within(publishedRow as HTMLElement).getByText(/^published$/i)).toBeInTheDocument()
  })

  describe('accessibility', () => {
    it('renders the loaded recipe list with no detectable axe violations', async () => {
      const { container } = await renderRecipeList()

      expect(screen.getByText('Spaghetti Bolognese')).toBeInTheDocument()
      expect(await axe(container)).toHaveNoViolations()
    })

    it('renders the empty state with no detectable axe violations', async () => {
      vi.mocked(fetchAllRecipes).mockResolvedValue([])
      const { container } = await renderRecipeList()

      expect(screen.getByText(/no recipes yet/i)).toBeInTheDocument()
      expect(await axe(container)).toHaveNoViolations()
    })

    it('renders the error state with no detectable axe violations', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.mocked(fetchAllRecipes).mockRejectedValue(new Error('500 Internal Server Error'))
      const { container } = await renderRecipeList()

      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
      expect(await axe(container)).toHaveNoViolations()
    })
  })
})
