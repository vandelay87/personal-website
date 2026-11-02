import { describe, it, expect, vi } from 'vitest'
import { posts, getPost, loadPostContent } from './index'

vi.mock('virtual:blog-posts-meta', () => ({
  frontmatterMap: {
    './older-post.mdx': {
      title: 'Older Post',
      date: '2026-03-01',
      description: 'An older post.',
      tags: ['misc'],
    },
    './test-post.mdx': {
      title: 'Test Post',
      date: '2026-04-06',
      description: 'A test post to verify the MDX pipeline.',
      tags: ['test'],
      hero: { stem: 'cover', alt: 'Cover alt', caption: 'Cover caption' },
    },
  },
  readingTimeMap: {
    './test-post.mdx': 4,
  },
}))

describe('Post registry', () => {
  it('discovers posts from the frontmatter map', () => {
    expect(posts).toHaveLength(2)
  })

  it('sorts posts by date, newest first, with slugs taken from the filename', () => {
    expect(posts.map((post) => post.slug)).toEqual(['test-post', 'older-post'])
  })

  it('includes correct metadata', () => {
    const post = getPost('test-post')
    expect(post).toBeDefined()
    expect(post!.title).toBe('Test Post')
    expect(post!.date).toBe('2026-04-06')
    expect(post!.description).toBe('A test post to verify the MDX pipeline.')
    expect(post!.tags).toEqual(['test'])
    expect(post!.readingTime).toBe(4)
  })

  it('falls back to a one-minute reading time when none is recorded', () => {
    expect(getPost('older-post')!.readingTime).toBe(1)
  })

  it('returns undefined for unknown slug', () => {
    expect(getPost('nonexistent')).toBeUndefined()
  })

  it('returns a content loader for a slug with an MDX file', () => {
    expect(loadPostContent('building-a-pokedex')).toBeTypeOf('function')
  })

  it('returns undefined content loader for invalid slug', () => {
    expect(loadPostContent('nonexistent')).toBeUndefined()
  })
})

describe('Post registry hero derivation', () => {
  it('derives the hero src, srcSet and OG image from the post slug and frontmatter stem', () => {
    const post = getPost('test-post')

    expect(post?.hero).toEqual({
      image: {
        src: 'https://images.akli.dev/blog/test-post/cover-medium.webp',
        srcSet:
          'https://images.akli.dev/blog/test-post/cover-medium.webp 800w, https://images.akli.dev/blog/test-post/cover-full.webp 1200w',
        alt: 'Cover alt',
        caption: 'Cover caption',
      },
      ogImage: 'https://images.akli.dev/blog/test-post/cover-full.webp',
    })
  })

  it('sets no hero when the frontmatter has no hero', () => {
    const post = getPost('older-post')

    expect(post).toBeDefined()
    expect(post).not.toHaveProperty('hero')
  })
})
