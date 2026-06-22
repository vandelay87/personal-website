import {
  RECIPE_IMAGE_BASE,
  recipeImageUrl,
  sluggify,
  type RecipeImageVariant,
} from '@models/recipe'
import { describe, it, expect } from 'vitest'

describe('RECIPE_IMAGE_BASE', () => {
  it('points at the images.akli.dev CDN host', () => {
    expect(RECIPE_IMAGE_BASE).toBe('https://images.akli.dev')
  })
})

describe('recipeImageUrl', () => {
  it('builds a cover image URL from slug, imageType and variant', () => {
    expect(recipeImageUrl('beans-on-toast', 'cover', 'medium')).toBe(
      'https://images.akli.dev/recipes/beans-on-toast/cover-medium.webp'
    )
  })

  it('builds a step image URL preserving the UUID-shaped step id verbatim', () => {
    expect(
      recipeImageUrl('beans-on-toast', 'step-9d904a59-e83f-43b8-9f40-fbdb3008974c', 'thumb')
    ).toBe(
      'https://images.akli.dev/recipes/beans-on-toast/step-9d904a59-e83f-43b8-9f40-fbdb3008974c-thumb.webp'
    )
  })

  it.each<[RecipeImageVariant, string]>([
    ['thumb', 'https://images.akli.dev/recipes/spaghetti-bolognese/cover-thumb.webp'],
    ['medium', 'https://images.akli.dev/recipes/spaghetti-bolognese/cover-medium.webp'],
    ['full', 'https://images.akli.dev/recipes/spaghetti-bolognese/cover-full.webp'],
  ])('suffixes the %s variant before the .webp extension', (variant, expected) => {
    expect(recipeImageUrl('spaghetti-bolognese', 'cover', variant)).toBe(expected)
  })

  it('does not URL-encode forward slashes in the derived path', () => {
    const url = recipeImageUrl('beans-on-toast', 'cover', 'medium')
    expect(url).toContain('/recipes/beans-on-toast/')
    expect(url).not.toContain('%2F')
  })

  it('rejects an imageType that is not "cover" nor a "step-" prefix at compile time', () => {
    // @ts-expect-error — 'cover2' is not assignable to 'cover' | `step-${string}`
    const result = recipeImageUrl('s', 'cover2', 'thumb')
    expect(typeof result).toBe('string')
  })

  it('rejects a step imageType missing the "step-" prefix at compile time', () => {
    // @ts-expect-error — 'stepX' is not assignable to 'cover' | `step-${string}`
    const result = recipeImageUrl('s', 'stepX', 'thumb')
    expect(typeof result).toBe('string')
  })

  it('rejects variants outside the RecipeImageVariant union at compile time', () => {
    // @ts-expect-error — 'large' is not a valid RecipeImageVariant
    const result = recipeImageUrl('s', 'cover', 'large')
    expect(typeof result).toBe('string')
  })
})

describe('sluggify', () => {
  it('lowercases and hyphenates a multi-word title', () => {
    expect(sluggify('Beans on Toast')).toBe('beans-on-toast')
  })

  it('strips diacritics and trims surrounding whitespace', () => {
    expect(sluggify('  Café Crème  ')).toBe('cafe-creme')
  })

  it('handles combined diacritics and special characters', () => {
    expect(sluggify('Crème Brûlée!')).toBe('creme-brulee')
  })

  it('collapses runs of non-alphanumeric characters into a single hyphen', () => {
    expect(sluggify('A!@#B')).toBe('a-b')
  })

  it('trims leading and trailing hyphens', () => {
    expect(sluggify('---a---')).toBe('a')
  })

  it('caps the slug length at 100 characters', () => {
    expect(sluggify('a'.repeat(150))).toHaveLength(100)
  })

  it('preserves a numeric-only input', () => {
    expect(sluggify('123')).toBe('123')
  })

  it('reduces a pure-diacritic character to its base letter', () => {
    expect(sluggify('Ñ')).toBe('n')
  })

  it('returns an empty string for empty input', () => {
    expect(sluggify('')).toBe('')
  })
})
