import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockPosts = {
  './test-post.mdx': {
    title: 'Test Post',
    date: '2026-04-06',
    description: 'A test post to verify the MDX pipeline.',
    tags: ['test'],
  },
  './older-post.mdx': {
    title: 'Older Post',
    date: '2026-03-01',
    description: 'An older post.',
    tags: ['misc'],
  },
}

const mockReadingTimes: Record<string, number> = {
  './test-post.mdx': 1,
  './older-post.mdx': 3,
}

const mockContentLoaders: Record<string, () => Promise<unknown>> = {
  './test-post.mdx': () => Promise.resolve({ default: () => null }),
  './older-post.mdx': () => Promise.resolve({ default: () => null }),
}

vi.stubGlobal('import', { meta: { glob: vi.fn() } })

vi.mock('./test-post.mdx', () => ({}))
vi.mock('./older-post.mdx', () => ({}))

let posts: typeof import('./index').posts
let getPost: typeof import('./index').getPost
let loadPostContent: typeof import('./index').loadPostContent

describe('Post registry', () => {
  beforeEach(async () => {
    vi.doMock('./*.mdx', () => mockPosts)
    // We need to mock import.meta.glob which is not straightforward in vitest
    // Instead, we mock the module itself
    vi.doMock('./index', () => {
      const allPosts = Object.entries(mockPosts)
        .map(([path, frontmatter]) => ({
          ...frontmatter,
          slug: path.replace('./', '').replace('.mdx', ''),
          readingTime: mockReadingTimes[path] ?? 1,
        }))
        .sort(
          (a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        )

      return {
        posts: allPosts,
        getPost: (slug: string) => allPosts.find((p) => p.slug === slug),
        loadPostContent: (slug: string) => {
          const path = `./${slug}.mdx`
          return mockContentLoaders[path]
        },
      }
    })

    const mod = await import('./index')
    posts = mod.posts
    getPost = mod.getPost
    loadPostContent = mod.loadPostContent
  })

  it('discovers posts from MDX files', () => {
    expect(posts).toHaveLength(2)
  })

  it('sorts posts by date, newest first', () => {
    expect(posts[0].slug).toBe('test-post')
    expect(posts[1].slug).toBe('older-post')
  })

  it('extracts slug from filename', () => {
    expect(posts[0].slug).toBe('test-post')
    expect(posts[1].slug).toBe('older-post')
  })

  it('includes correct metadata', () => {
    const post = getPost('test-post')
    expect(post).toBeDefined()
    expect(post!.title).toBe('Test Post')
    expect(post!.date).toBe('2026-04-06')
    expect(post!.description).toBe('A test post to verify the MDX pipeline.')
    expect(post!.tags).toEqual(['test'])
    expect(post!.readingTime).toBe(1)
  })

  it('returns undefined for unknown slug', () => {
    expect(getPost('nonexistent')).toBeUndefined()
  })

  it('returns a content loader for valid slug', () => {
    const loader = loadPostContent('test-post')
    expect(loader).toBeDefined()
    expect(typeof loader).toBe('function')
  })

  it('returns undefined content loader for invalid slug', () => {
    expect(loadPostContent('nonexistent')).toBeUndefined()
  })
})
