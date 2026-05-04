import { RECIPE_IMAGE_BASE, recipeImageUrl, type RecipeImageVariant } from '@models/recipe'
import { describe, it, expect } from 'vitest'

describe('RECIPE_IMAGE_BASE', () => {
  it('points at the images.akli.dev CDN host', () => {
    expect(RECIPE_IMAGE_BASE).toBe('https://images.akli.dev')
  })
})

describe('recipeImageUrl', () => {
  it('builds a medium-variant URL for a simple cover key', () => {
    expect(recipeImageUrl('recipes/abc-123/cover', 'medium')).toBe(
      'https://images.akli.dev/recipes/abc-123/cover-medium.webp'
    )
  })

  it.each<[RecipeImageVariant, string]>([
    ['thumb', 'https://images.akli.dev/recipes/abc-123/cover-thumb.webp'],
    ['medium', 'https://images.akli.dev/recipes/abc-123/cover-medium.webp'],
    ['full', 'https://images.akli.dev/recipes/abc-123/cover-full.webp'],
  ])('suffixes the %s variant before the .webp extension', (variant, expected) => {
    expect(recipeImageUrl('recipes/abc-123/cover', variant)).toBe(expected)
  })

  it('preserves a UUID-shaped key segment verbatim without URL-encoding', () => {
    expect(recipeImageUrl('recipes/9d904a59-e83f-43b8-9f40-fbdb3008974c/cover', 'medium')).toBe(
      'https://images.akli.dev/recipes/9d904a59-e83f-43b8-9f40-fbdb3008974c/cover-medium.webp'
    )
  })

  it('builds a step image URL with the thumb variant', () => {
    expect(recipeImageUrl('recipes/abc/step-1', 'thumb')).toBe(
      'https://images.akli.dev/recipes/abc/step-1-thumb.webp'
    )
  })

  it('does not URL-encode forward slashes in nested keys', () => {
    const url = recipeImageUrl('recipes/x/y/z', 'medium')
    expect(url).toContain('/')
    expect(url).not.toContain('%2F')
  })

  it('returns the base with a bare variant suffix for an empty key', () => {
    expect(recipeImageUrl('', 'medium')).toBe('https://images.akli.dev/-medium.webp')
  })

  it('rejects variants outside the RecipeImageVariant union at compile time', () => {
    // @ts-expect-error — 'large' is not a valid RecipeImageVariant
    const result = recipeImageUrl('recipes/x/cover', 'large')
    expect(typeof result).toBe('string')
  })
})
