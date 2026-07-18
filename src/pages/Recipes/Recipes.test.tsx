import { fetchRecipes, fetchTags } from '@api/recipes'
import type { RecipeIndex, Tag } from '@models/recipe'
import {
  act,
  render,
  screen,
  fireEvent,
  waitFor,
  type RenderResult,
} from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { axe } from 'vitest-axe'
import Recipes from './Recipes'

const LocationDisplay = () => {
  const location = useLocation()
  return <div data-testid="location">{location.pathname}{location.search}</div>
}

vi.mock('@api/recipes', () => ({
  fetchRecipes: vi.fn(),
  fetchTags: vi.fn(),
}))

const mockRecipes: RecipeIndex[] = [
  {
    id: 'rec-001',
    title: 'Classic Margherita Pizza',
    slug: 'classic-margherita-pizza',
    coverImage: { alt: 'Margherita pizza' },
    tags: ['Italian', 'Quick'],
    prepTime: 15,
    cookTime: 12,
    servings: 4,
    createdAt: '2026-03-20T10:00:00Z',
  },
  {
    id: 'rec-002',
    title: 'Thai Green Curry',
    slug: 'thai-green-curry',
    coverImage: { alt: 'Thai green curry' },
    tags: ['Thai', 'Spicy'],
    prepTime: 20,
    cookTime: 25,
    servings: 2,
    createdAt: '2026-03-18T10:00:00Z',
  },
  {
    id: 'rec-003',
    title: 'Italian Pasta Carbonara',
    slug: 'italian-pasta-carbonara',
    coverImage: { alt: 'Pasta carbonara' },
    tags: ['Italian'],
    prepTime: 10,
    cookTime: 15,
    servings: 3,
    createdAt: '2026-03-15T10:00:00Z',
  },
]

const mockTags: Tag[] = [
  { tag: 'Italian', count: 2 },
  { tag: 'Quick', count: 1 },
  { tag: 'Thai', count: 1 },
  { tag: 'Spicy', count: 1 },
]

// Recipes suspends on mount (Suspense + `use()`), so the initial render must
// be awaited inside an async act() — otherwise React defers the resolved
// commit indefinitely instead of applying it once the fetch settles.
const renderRecipes = async (
  initialRoute = '/recipes',
  { withLocation = false } = {}
): Promise<RenderResult> => {
  let result!: RenderResult
  await act(async () => {
    result = render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <Recipes />
        {withLocation && <LocationDisplay />}
      </MemoryRouter>
    )
  })
  return result
}

describe('Recipes page', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(fetchRecipes).mockResolvedValue(mockRecipes)
    vi.mocked(fetchTags).mockResolvedValue(mockTags)
  })

  it('renders recipe grid after loading', async () => {
    await renderRecipes()

    expect(screen.getByText('Classic Margherita Pizza')).toBeInTheDocument()
    expect(screen.getByText('Thai Green Curry')).toBeInTheDocument()
    expect(screen.getByText('Italian Pasta Carbonara')).toBeInTheDocument()
  })

  it('shows loading indicator while fetching', async () => {
    vi.mocked(fetchRecipes).mockReturnValue(new Promise(() => {}))
    vi.mocked(fetchTags).mockReturnValue(new Promise(() => {}))

    await renderRecipes()

    expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument()
  })

  it('filters by tag via URL search param (?tag=Italian)', async () => {
    await renderRecipes('/recipes?tag=Italian')

    expect(screen.getByText('Classic Margherita Pizza')).toBeInTheDocument()
    expect(screen.getByText('Italian Pasta Carbonara')).toBeInTheDocument()
    expect(screen.queryByText('Thai Green Curry')).not.toBeInTheDocument()
  })

  it('clicking a tag chip writes ?tag=<tag> to the URL', async () => {
    await renderRecipes('/recipes', { withLocation: true })

    expect(screen.getByText('Classic Margherita Pizza')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /italian/i }))

    expect(screen.getByTestId('location')).toHaveTextContent('/recipes?tag=Italian')
    expect(screen.getByRole('button', { name: /italian/i })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
  })

  it('clicking the active tag chip again clears ?tag from the URL', async () => {
    await renderRecipes('/recipes?tag=Italian', { withLocation: true })

    expect(screen.getByText('Classic Margherita Pizza')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /italian/i }))

    expect(screen.getByTestId('location')).toHaveTextContent('/recipes')
    expect(screen.getByTestId('location').textContent).not.toMatch(/tag=/)
  })

  it('searches by keyword (title match)', async () => {
    await renderRecipes()

    expect(screen.getByText('Classic Margherita Pizza')).toBeInTheDocument()

    const searchInput = screen.getByRole('searchbox', { name: /search recipes/i })
    fireEvent.change(searchInput, { target: { value: 'curry' } })

    // RecipeSearch debounces onSearch by 300ms.
    await waitFor(() => {
      expect(screen.getByText('Thai Green Curry')).toBeInTheDocument()
      expect(screen.queryByText('Classic Margherita Pizza')).not.toBeInTheDocument()
    })
  })

  it('searches by keyword (tag match)', async () => {
    await renderRecipes()

    expect(screen.getByText('Classic Margherita Pizza')).toBeInTheDocument()

    // "Spicy" only appears as a tag (on Thai Green Curry), not in any title.
    const searchInput = screen.getByRole('searchbox', { name: /search recipes/i })
    fireEvent.change(searchInput, { target: { value: 'spicy' } })

    // RecipeSearch debounces onSearch by 300ms.
    await waitFor(() => {
      expect(screen.getByText('Thai Green Curry')).toBeInTheDocument()
      expect(screen.queryByText('Classic Margherita Pizza')).not.toBeInTheDocument()
      expect(screen.queryByText('Italian Pasta Carbonara')).not.toBeInTheDocument()
    })
  })

  it('applies combined tag + search filtering', async () => {
    await renderRecipes('/recipes?tag=Italian')

    expect(screen.getByText('Classic Margherita Pizza')).toBeInTheDocument()

    const searchInput = screen.getByRole('searchbox', { name: /search recipes/i })
    fireEvent.change(searchInput, { target: { value: 'carbonara' } })

    // RecipeSearch debounces onSearch by 300ms.
    await waitFor(() => {
      expect(screen.getByText('Italian Pasta Carbonara')).toBeInTheDocument()
      expect(screen.queryByText('Classic Margherita Pizza')).not.toBeInTheDocument()
    })
  })

  it('shows the no-results message with clear button when filter has no matches', async () => {
    await renderRecipes()

    expect(screen.getByText('Classic Margherita Pizza')).toBeInTheDocument()

    const searchInput = screen.getByRole('searchbox', { name: /search recipes/i })
    fireEvent.change(searchInput, { target: { value: 'nonexistent dish xyz' } })

    // RecipeSearch debounces onSearch by 300ms.
    await waitFor(() => {
      expect(screen.getByText(/nothing in the kitchen matches that/i)).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /clear filter/i })).toBeInTheDocument()
  })

  it('shows "Recipes coming soon" when no recipes exist', async () => {
    vi.mocked(fetchRecipes).mockResolvedValue([])
    vi.mocked(fetchTags).mockResolvedValue([])

    await renderRecipes()

    expect(screen.getByText(/recipes coming soon/i)).toBeInTheDocument()
  })

  it('shows error state with retry button when API fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(fetchRecipes).mockRejectedValue(new Error('500 Internal Server Error'))
    vi.mocked(fetchTags).mockRejectedValue(new Error('500 Internal Server Error'))

    await renderRecipes()

    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })

  it('retrying after an error re-fetches and shows the recipe grid', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(fetchRecipes).mockRejectedValueOnce(new Error('500 Internal Server Error'))
    vi.mocked(fetchTags).mockRejectedValueOnce(new Error('500 Internal Server Error'))

    await renderRecipes()

    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /retry/i }))
    })

    expect(screen.getByText('Classic Margherita Pizza')).toBeInTheDocument()
  })

  it('has aria-live region for recipe count', async () => {
    await renderRecipes()

    expect(screen.getByText('Classic Margherita Pizza')).toBeInTheDocument()

    const liveRegion = screen.getByRole('status')
    expect(liveRegion).toHaveAttribute('aria-live', 'polite')
  })

  describe('accessibility', () => {
    it('renders the default loaded recipe grid with no detectable axe violations', async () => {
      const { container } = await renderRecipes()

      expect(screen.getByText('Classic Margherita Pizza')).toBeInTheDocument()
      expect(await axe(container)).toHaveNoViolations()
    })

    it('renders the no-results empty state with no detectable axe violations', async () => {
      const { container } = await renderRecipes()

      expect(screen.getByText('Classic Margherita Pizza')).toBeInTheDocument()

      const searchInput = screen.getByRole('searchbox', { name: /search recipes/i })
      fireEvent.change(searchInput, { target: { value: 'nonexistent dish xyz' } })

      // RecipeSearch debounces onSearch by 300ms.
      await waitFor(() => {
        expect(screen.getByText(/nothing in the kitchen matches that/i)).toBeInTheDocument()
      })
      expect(await axe(container)).toHaveNoViolations()
    })
  })
})
