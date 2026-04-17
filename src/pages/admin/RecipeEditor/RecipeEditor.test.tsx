import { createRecipe, fetchMyRecipes, fetchTags, updateRecipe } from '@api/recipes'
import { useAuth } from '@contexts/AuthContext'
import type { Recipe } from '@models/recipe'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
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

const renderEditor = (route = '/admin/recipes/new') =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/admin/recipes/new" element={<RecipeEditor />} />
        <Route path="/admin/recipes/:id/edit" element={<RecipeEditor />} />
      </Routes>
    </MemoryRouter>
  )

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

    await user.click(screen.getByRole('button', { name: /save as draft/i }))

    await waitFor(() => {
      expect(screen.getByRole('status')).toBeInTheDocument()
      expect(screen.getByText(/recipe saved/i)).toBeInTheDocument()
    })
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

    await user.click(screen.getByRole('button', { name: /save as draft/i }))

    await waitFor(() => {
      expect(screen.getByRole('status')).toBeInTheDocument()
      expect(screen.getByText(/error/i)).toBeInTheDocument()
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
})
