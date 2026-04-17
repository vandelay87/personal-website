import { fetchMyRecipes, publishRecipe } from '@api/recipes'
import { useAuth } from '@contexts/AuthContext'
import type { Recipe } from '@models/recipe'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import RecipePreview from './RecipePreview'

vi.mock('@api/recipes', () => ({
  fetchMyRecipes: vi.fn(),
  publishRecipe: vi.fn(),
}))

vi.mock('@contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

const mockDraftRecipe: Recipe = {
  id: 'rec-draft',
  title: 'Draft Lemon Tart',
  slug: 'draft-lemon-tart',
  coverImage: { key: 'recipes/rec-draft/cover', alt: 'Lemon tart cover' },
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
    vi.mocked(useAuth).mockReturnValue({
      getAccessToken: vi.fn().mockResolvedValue('token-123'),
      isAdmin: true,
      user: { email: 'admin@akli.dev', groups: ['admin'] },
      isAuthenticated: true,
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
    })
    vi.mocked(fetchMyRecipes).mockResolvedValue([
      mockDraftRecipe,
      mockPublishedRecipe,
    ])
    vi.mocked(publishRecipe).mockResolvedValue(undefined)
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
    vi.mocked(fetchMyRecipes).mockReturnValue(new Promise(() => {}))
    renderPreview('rec-draft')

    expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument()
  })

  // Supporting — not-found path when the id doesn't resolve to an owned recipe.
  it('shows a not-found message when the id does not match any owned recipe', async () => {
    renderPreview('rec-missing')

    await waitFor(() => {
      expect(screen.getByText(/not found/i)).toBeInTheDocument()
    })
  })
})
