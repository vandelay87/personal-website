import type { RecipeIndex, Recipe, Tag } from '@models/recipe'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  fetchRecipes,
  fetchRecipe,
  fetchTags,
  fetchMyRecipes,
  updateRecipe,
  publishRecipe,
  unpublishRecipe,
  deleteRecipe,
  getUploadUrl,
} from './recipes'

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

const _statusOk: Recipe['status'] = 'draft'
const _statusOk2: Recipe['status'] = 'published'
// @ts-expect-error — 'archived' is not a valid status
const _statusBad: Recipe['status'] = 'archived'
const _recipeWithTtl: Recipe = { ...mockRecipe, ttl: 123 }
const _coverWithProcessedAt: Recipe['coverImage'] = {
  key: 'spaghetti-cover',
  alt: 'A bowl of spaghetti bolognese',
  processedAt: 1714000000,
}

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

describe('authenticated recipe endpoints', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('fetchMyRecipes', () => {
    it('sends token and returns recipes', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve([mockRecipe]),
        })
      )

      const result = await fetchMyRecipes('token-123')

      expect(result).toEqual([mockRecipe])
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/me/recipes'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer token-123',
          }),
        })
      )
    })
  })

  describe('createDraft', () => {
    it('POST /recipes/drafts with token and returns { id, slug }', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ id: 'r1', slug: 'my-slug' }),
        })
      )

      const mod = await import('./recipes')
      const result = await mod.createDraft('token-123')

      expect(result).toEqual({ id: 'r1', slug: 'my-slug' })
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/recipes/drafts'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer token-123',
          }),
        })
      )
    })

    it('throws with 401 on unauthorised', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
        })
      )

      const mod = await import('./recipes')
      await expect(mod.createDraft('bad-token')).rejects.toThrow('401')
    })
  })

  describe('fetchAllRecipes', () => {
    it('GET /recipes/admin with token and returns the array verbatim', async () => {
      // Deployed backend returns a plain Recipe[] (not { recipes: Recipe[] }).
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve([mockRecipe]),
        })
      )

      const mod = await import('./recipes')
      const result = await mod.fetchAllRecipes('token-123')

      expect(result).toEqual([mockRecipe])
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/recipes/admin'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer token-123',
          }),
        })
      )
    })

    it('throws with 401 on unauthorised', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
        })
      )

      const mod = await import('./recipes')
      await expect(mod.fetchAllRecipes('bad-token')).rejects.toThrow('401')
    })
  })

  describe('fetchRecipeByIdAdmin', () => {
    it('GET /recipes/admin/{id} with token and returns the Recipe', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockRecipe),
        })
      )

      const mod = await import('./recipes')
      const result = await mod.fetchRecipeByIdAdmin('token-123', 'r1')

      expect(result).toEqual(mockRecipe)
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/recipes/admin/r1'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer token-123',
          }),
        })
      )
    })

    it('throws with 401 on unauthorised', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
        })
      )

      const mod = await import('./recipes')
      await expect(mod.fetchRecipeByIdAdmin('bad-token', 'r1')).rejects.toThrow('401')
    })

    it('throws with 404 when recipe is missing', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status: 404,
          statusText: 'Not Found',
        })
      )

      const mod = await import('./recipes')
      await expect(mod.fetchRecipeByIdAdmin('token-123', 'missing')).rejects.toThrow('404')
    })
  })

  describe('updateRecipe', () => {
    it('PATCH with token, id, and data', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockRecipe),
        })
      )

      const data = { title: 'Updated Recipe' }
      const result = await updateRecipe('token-123', 'r1', data)

      expect(result).toEqual(mockRecipe)
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/recipes/r1'),
        expect.objectContaining({
          method: 'PATCH',
          headers: expect.objectContaining({
            Authorization: 'Bearer token-123',
          }),
          body: JSON.stringify(data),
        })
      )
    })
  })

  describe('publishRecipe', () => {
    it('PATCH and returns the updated Recipe with status=published', async () => {
      const published: Recipe = { ...mockRecipe, status: 'published' }
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(published) })
      )

      const result = await publishRecipe('token-123', 'r1')

      expect(result).toEqual(published)
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/recipes/r1/publish'),
        expect.objectContaining({
          method: 'PATCH',
          headers: expect.objectContaining({
            Authorization: 'Bearer token-123',
          }),
        })
      )
    })

    it('throws with 401 on unauthorised', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
        })
      )

      await expect(publishRecipe('bad-token', 'r1')).rejects.toThrow('401')
    })
  })

  describe('unpublishRecipe', () => {
    it('PATCH and returns the updated Recipe with status=draft', async () => {
      const draft: Recipe = { ...mockRecipe, status: 'draft' }
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(draft) })
      )

      const result = await unpublishRecipe('token-123', 'r1')

      expect(result).toEqual(draft)
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/recipes/r1/unpublish'),
        expect.objectContaining({
          method: 'PATCH',
          headers: expect.objectContaining({
            Authorization: 'Bearer token-123',
          }),
        })
      )
    })

    it('throws with 401 on unauthorised', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
        })
      )

      await expect(unpublishRecipe('bad-token', 'r1')).rejects.toThrow('401')
    })
  })

  describe('deleteRecipe', () => {
    it('DELETE with token', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(undefined) })
      )

      await deleteRecipe('token-123', 'r1')

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/recipes/r1'),
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            Authorization: 'Bearer token-123',
          }),
        })
      )
    })
  })

  describe('getUploadUrl', () => {
    it('POST with token and params', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ uploadUrl: 'https://s3.example.com/upload', key: 'img-key' }),
        })
      )

      const params = { recipeId: 'r1', imageType: 'cover' }
      const result = await getUploadUrl('token-123', params)

      expect(result).toEqual({ uploadUrl: 'https://s3.example.com/upload', key: 'img-key' })
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/recipes/images/upload-url'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer token-123',
          }),
          body: JSON.stringify(params),
        })
      )
    })
  })
})

describe('createRecipe removal', () => {
  it('does not export createRecipe', async () => {
    const mod = await import('./recipes')
    expect('createRecipe' in mod).toBe(false)
  })
})
