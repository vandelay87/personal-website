import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchRecipes, fetchRecipe, fetchTags } from './recipes'
import type { RecipeIndex, Recipe, Tag } from '../types/recipe'

const mockRecipeIndex: RecipeIndex = {
  id: 'r1',
  title: 'Spaghetti Bolognese',
  slug: 'spaghetti-bolognese',
  coverImage: { key: 'spaghetti-cover', alt: 'A bowl of spaghetti bolognese' },
  tags: ['Italian', 'Pasta'],
  prepTime: 15,
  cookTime: 45,
  servings: 4,
  createdAt: '2026-03-01T12:00:00Z',
}

const mockRecipe: Recipe = {
  ...mockRecipeIndex,
  intro: 'A classic Italian pasta dish.',
  ingredients: [
    { item: 'spaghetti', quantity: '400', unit: 'g' },
    { item: 'minced beef', quantity: '500', unit: 'g' },
  ],
  steps: [
    { order: 1, text: 'Boil the pasta.' },
    { order: 2, text: 'Brown the mince.', image: { key: 'step-2', alt: 'Browning mince in a pan' } },
  ],
  authorId: 'a1',
  authorName: 'Akli Aissat',
  updatedAt: '2026-03-02T10:00:00Z',
  status: 'published',
}

const mockTags: Tag[] = [
  { tag: 'Italian', count: 3 },
  { tag: 'Quick', count: 5 },
]

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('fetchRecipes', () => {
  it('returns an array of RecipeIndex on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([mockRecipeIndex]),
      })
    )

    const result = await fetchRecipes()

    expect(result).toEqual([mockRecipeIndex])
    expect(fetch).toHaveBeenCalledWith('https://api.akli.dev/recipes')
  })

  it('throws on HTTP 404', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })
    )

    await expect(fetchRecipes()).rejects.toThrow('404')
  })

  it('throws on HTTP 500', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })
    )

    await expect(fetchRecipes()).rejects.toThrow('500')
  })

  it('throws on network failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    )

    await expect(fetchRecipes()).rejects.toThrow('Failed to fetch')
  })
})

describe('fetchRecipe', () => {
  it('returns a Recipe on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockRecipe),
      })
    )

    const result = await fetchRecipe('spaghetti-bolognese')

    expect(result).toEqual(mockRecipe)
  })

  it('calls the correct URL with the slug', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockRecipe),
      })
    )

    await fetchRecipe('spaghetti-bolognese')

    expect(fetch).toHaveBeenCalledWith('https://api.akli.dev/recipes/spaghetti-bolognese')
  })

  it('throws on HTTP 404', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })
    )

    await expect(fetchRecipe('nonexistent')).rejects.toThrow('404')
  })

  it('throws on network failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    )

    await expect(fetchRecipe('spaghetti-bolognese')).rejects.toThrow('Failed to fetch')
  })
})

describe('fetchTags', () => {
  it('returns an array of Tag on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockTags),
      })
    )

    const result = await fetchTags()

    expect(result).toEqual(mockTags)
    expect(fetch).toHaveBeenCalledWith('https://api.akli.dev/recipes/tags')
  })

  it('throws on HTTP error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      })
    )

    await expect(fetchTags()).rejects.toThrow('503')
  })
})
