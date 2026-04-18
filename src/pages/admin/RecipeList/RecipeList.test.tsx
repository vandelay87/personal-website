import { deleteRecipe, fetchMyRecipes, publishRecipe, unpublishRecipe } from '@api/recipes'
import { useAuth } from '@contexts/AuthContext'
import type { Recipe } from '@models/recipe'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import RecipeList from './RecipeList'

vi.mock('@api/recipes', () => ({
  fetchMyRecipes: vi.fn(),
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
  coverImage: { key: 'recipes/rec-001/cover', alt: 'Spaghetti bolognese' },
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
  coverImage: { key: 'recipes/rec-002/cover', alt: 'Thai green curry' },
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

const renderRecipeList = () =>
  render(
    <MemoryRouter initialEntries={['/admin/recipes']}>
      <RecipeList />
    </MemoryRouter>
  )

const renderRecipeListWithAccessDenied = () =>
  render(
    <MemoryRouter
      initialEntries={[{ pathname: '/admin/recipes', state: { accessDenied: true } }]}
    >
      <RecipeList />
    </MemoryRouter>
  )

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
    vi.mocked(fetchMyRecipes).mockResolvedValue([mockDraftRecipe, mockPublishedRecipe])
    vi.mocked(publishRecipe).mockResolvedValue(undefined)
    vi.mocked(unpublishRecipe).mockResolvedValue(undefined)
    vi.mocked(deleteRecipe).mockResolvedValue(undefined)
  })

  it('renders recipe list with titles and status badges', async () => {
    renderRecipeList()

    await waitFor(() => {
      expect(screen.getByText('Spaghetti Bolognese')).toBeInTheDocument()
    })
    expect(screen.getByText('Thai Green Curry')).toBeInTheDocument()
    expect(screen.getByText(/draft/i)).toBeInTheDocument()
    expect(screen.getByText(/published/i)).toBeInTheDocument()
  })

  it('shows action buttons per row', async () => {
    renderRecipeList()

    await waitFor(() => {
      expect(screen.getByText('Spaghetti Bolognese')).toBeInTheDocument()
    })

    const editButtons = screen.getAllByRole('link', { name: /edit/i })
    const previewButtons = screen.getAllByRole('link', { name: /preview/i })
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i })

    expect(editButtons).toHaveLength(2)
    expect(previewButtons).toHaveLength(2)
    expect(deleteButtons).toHaveLength(2)
  })

  it('has a new recipe button linking to /admin/recipes/new', async () => {
    renderRecipeList()

    await waitFor(() => {
      expect(screen.getByText('Spaghetti Bolognese')).toBeInTheDocument()
    })

    const newRecipeLink = screen.getByRole('link', { name: /new recipe/i })
    expect(newRecipeLink).toHaveAttribute('href', '/admin/recipes/new')
  })

  it('shows confirmation dialog when delete is clicked', async () => {
    renderRecipeList()

    await waitFor(() => {
      expect(screen.getByText('Spaghetti Bolognese')).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
    fireEvent.click(deleteButtons[0])

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('executes delete after confirmation', async () => {
    renderRecipeList()

    await waitFor(() => {
      expect(screen.getByText('Spaghetti Bolognese')).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
    fireEvent.click(deleteButtons[0])

    const confirmButton = screen.getByRole('button', { name: /confirm/i })
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(deleteRecipe).toHaveBeenCalledWith('token-123', 'rec-001')
    })
  })

  it('shows Publish button for draft and Unpublish for published recipe', async () => {
    renderRecipeList()

    await waitFor(() => {
      expect(screen.getByText('Spaghetti Bolognese')).toBeInTheDocument()
    })

    const publishButton = screen.getByRole('button', { name: /^publish$/i })
    const unpublishButton = screen.getByRole('button', { name: /unpublish/i })

    expect(publishButton).toBeInTheDocument()
    expect(unpublishButton).toBeInTheDocument()

    fireEvent.click(publishButton)

    await waitFor(() => {
      expect(publishRecipe).toHaveBeenCalledWith('token-123', 'rec-001')
    })
  })

  it('shows empty state when no recipes exist', async () => {
    vi.mocked(fetchMyRecipes).mockResolvedValue([])
    renderRecipeList()

    await waitFor(() => {
      expect(screen.getByText(/no recipes yet/i)).toBeInTheDocument()
    })

    expect(screen.getByRole('link', { name: /create/i })).toBeInTheDocument()
  })

  it('shows loading indicator while fetching', () => {
    vi.mocked(fetchMyRecipes).mockReturnValue(new Promise(() => {}))
    renderRecipeList()

    expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument()
  })

  it('shows error state with retry button when fetch fails', async () => {
    vi.mocked(fetchMyRecipes).mockRejectedValue(new Error('500 Internal Server Error'))
    renderRecipeList()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })
  })

  it('shows an "Access denied" toast when navigated here with accessDenied state', async () => {
    renderRecipeListWithAccessDenied()

    const toast = await screen.findByText(/access denied/i)
    expect(toast).toBeInTheDocument()

    // The toast should use role="status" for accessibility (aria-live)
    const statuses = await screen.findAllByRole('status')
    const accessDeniedStatus = statuses.find((el) => /access denied/i.test(el.textContent ?? ''))
    expect(accessDeniedStatus).toBeDefined()
  })
})
