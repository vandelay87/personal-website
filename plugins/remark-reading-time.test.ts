import { describe, it, expect } from 'vitest'
import type { Root } from 'mdast'
import remarkReadingTime, { calculateReadingTime } from './remark-reading-time'

describe('calculateReadingTime', () => {
  it('returns 1 minute for a short text', () => {
    expect(calculateReadingTime('hello world')).toBe(1)
  })

  it('returns 1 minute for exactly 200 words', () => {
    const text = Array(200).fill('word').join(' ')
    expect(calculateReadingTime(text)).toBe(1)
  })

  it('returns 2 minutes for 201 words', () => {
    const text = Array(201).fill('word').join(' ')
    expect(calculateReadingTime(text)).toBe(2)
  })

  it('returns 1 minute for empty text', () => {
    expect(calculateReadingTime('')).toBe(0)
  })

  it('handles whitespace-only text', () => {
    expect(calculateReadingTime('   ')).toBe(0)
  })
})

describe('remarkReadingTime', () => {
  it('adds a readingTime export to the AST', () => {
    const tree: Root = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            { type: 'text', value: 'Hello world this is a test post' },
          ],
        },
      ],
    }

    const plugin = remarkReadingTime()
    plugin(tree)

    const esmNode = tree.children[0] as unknown as { type: string; value: string }
    expect(esmNode.type).toBe('mdxjsEsm')
    expect(esmNode.value).toBe('export const readingTime = 1')
  })

  it('calculates reading time from multiple text nodes', () => {
    const words = Array(250).fill('word').join(' ')
    const tree: Root = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            { type: 'text', value: words },
          ],
        },
        {
          type: 'paragraph',
          children: [
            { type: 'text', value: 'extra words here' },
          ],
        },
      ],
    }

    const plugin = remarkReadingTime()
    plugin(tree)

    const esmNode = tree.children[0] as unknown as { type: string; value: string }
    expect(esmNode.value).toBe('export const readingTime = 2')
  })

  it('returns 0 for a tree with no text nodes', () => {
    const tree: Root = {
      type: 'root',
      children: [],
    }

    const plugin = remarkReadingTime()
    plugin(tree)

    const esmNode = tree.children[0] as unknown as { type: string; value: string }
    expect(esmNode.value).toBe('export const readingTime = 0')
  })
})
