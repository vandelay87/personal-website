// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { readRecipeData } from './ssrData'

describe('readRecipeData (no window)', () => {
  it('returns {} instead of throwing when there is no window at all', () => {
    expect(typeof window).toBe('undefined')
    expect(readRecipeData()).toEqual({})
  })
})
