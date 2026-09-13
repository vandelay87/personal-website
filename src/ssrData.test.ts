import type { RecipeData } from '@contexts/RecipeDataContext'
import type { Recipe } from '@models/recipe'
import { describe, it, expect, afterEach } from 'vitest'
import { injectRecipeDataScript, readRecipeData } from './ssrData'

const mockRecipe: Recipe = {
  id: 'r1',
  title: 'Spaghetti Bolognese',
  slug: 'spaghetti-bolognese',
  coverImage: { alt: 'A bowl of spaghetti bolognese' },
  tags: ['Italian', 'Pasta'],
  prepTime: 15,
  cookTime: 45,
  servings: 4,
  createdAt: '2026-03-01T12:00:00Z',
  intro: 'A classic Italian pasta dish with rich meat sauce.',
  ingredients: [
    { item: 'spaghetti', quantity: '400', unit: 'g' },
    { item: 'minced beef', quantity: '500', unit: 'g' },
  ],
  steps: [
    { stepId: '9d904a59-e83f-43b8-9f40-fbdb3008974c', order: 1, text: 'Boil the pasta.' },
  ],
  authorId: 'a1',
  authorName: 'Akli Aissat',
  updatedAt: '2026-03-02T10:00:00Z',
  status: 'published',
}

describe('injectRecipeDataScript', () => {
  it('returns an empty string when data.recipe is undefined', () => {
    const result = injectRecipeDataScript({})
    expect(result).toBe('')
  })

  it('returns a script tag whose payload round-trips back to the original data', () => {
    const data: RecipeData = { recipe: mockRecipe }
    const result = injectRecipeDataScript(data)

    expect(result).toContain('window.__RECIPE_DATA__=')

    const match = result.match(/window\.__RECIPE_DATA__=(.*)<\/script>/)
    expect(match).not.toBeNull()

    const parsed = JSON.parse(match![1]) as RecipeData
    expect(parsed.recipe?.id).toBe(mockRecipe.id)
    expect(parsed.recipe?.title).toBe(mockRecipe.title)
  })

  it('neutralizes a </script> sequence inside recipe content so it cannot break out of the inline script tag', () => {
    const maliciousRecipe: Recipe = {
      ...mockRecipe,
      intro: 'Nice</script><script>alert(1)</script>',
    }
    const result = injectRecipeDataScript({ recipe: maliciousRecipe })

    // Exactly one literal `</script>` may appear: the tag's own real closing
    // tag at the very end. Any more means the payload broke out of the tag.
    expect(result.indexOf('</script>')).toBe(result.lastIndexOf('</script>'))
    expect(result.endsWith('</script>')).toBe(true)
  })
})

describe('readRecipeData', () => {
  afterEach(() => {
    delete (window as unknown as { __RECIPE_DATA__?: unknown }).__RECIPE_DATA__
  })

  it('returns {} when window.__RECIPE_DATA__ is not set', () => {
    delete (window as unknown as { __RECIPE_DATA__?: unknown }).__RECIPE_DATA__
    expect(readRecipeData()).toEqual({})
  })

  it('returns the parsed value when window.__RECIPE_DATA__ is set', () => {
    ;(window as unknown as { __RECIPE_DATA__?: unknown }).__RECIPE_DATA__ = {
      recipe: mockRecipe,
    }

    expect(readRecipeData()).toEqual({ recipe: mockRecipe })
  })
})
