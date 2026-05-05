// @vitest-environment node
import { describe, it, expect, vi } from 'vitest'

const mockPostData = vi.hoisted(() => ({
  testPost: {
    title: 'Test Post Title',
    date: '2025-01-15',
    description: 'A test post description for meta tag testing.',
    tags: ['testing'],
    slug: 'test-post',
    readingTime: 3,
    image: '/images/blog/test-post-cover.jpg',
  },
  testPostNoImage: {
    title: 'No Image Post',
    date: '2025-02-01',
    description: 'A post without an image.',
    tags: ['testing'],
    slug: 'no-image-post',
    readingTime: 2,
  },
}))

vi.mock('./pages/Blog/posts/index', () => ({
  posts: [mockPostData.testPost, mockPostData.testPostNoImage],
  getPost: (slug: string) =>
    [mockPostData.testPost, mockPostData.testPostNoImage].find((p) => p.slug === slug),
  getLazyPost: () => undefined,
  loadPostContent: () => undefined,
  formatDate: (d: string) => d,
}))

import { getMetaTags, normalisePath, escapeHtml, isKnownRoute } from './meta'

describe('normalisePath', () => {
  it('strips trailing slash from /apps/', () => {
    expect(normalisePath('/apps/')).toBe('/apps')
  })

  it('preserves root path /', () => {
    expect(normalisePath('/')).toBe('/')
  })

  it('strips trailing slash from /foo/bar/', () => {
    expect(normalisePath('/foo/bar/')).toBe('/foo/bar')
  })

  it('leaves paths without trailing slash unchanged', () => {
    expect(normalisePath('/apps')).toBe('/apps')
  })
})

describe('escapeHtml', () => {
  it('escapes ampersands', () => {
    expect(escapeHtml('A & B')).toBe('A &amp; B')
  })

  it('escapes angle brackets', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;')
  })

  it('escapes double quotes', () => {
    expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;')
  })

  it('returns plain text unchanged', () => {
    expect(escapeHtml('hello world')).toBe('hello world')
  })
})

describe('getMetaTags', () => {
  describe('home route /', () => {
    it('returns correct title', () => {
      const meta = getMetaTags('/')
      expect(meta.title).toBe('Akli Aissat — Full-Stack Engineer')
    })

    it('returns correct description', () => {
      const meta = getMetaTags('/')
      expect(meta.description).toBe(
        'Full-stack engineer building responsive web applications with React, TypeScript, and modern web technologies. Explore my projects and experiments.'
      )
    })

    it('returns correct canonical URL', () => {
      const meta = getMetaTags('/')
      expect(meta.canonical).toBe('https://akli.dev/')
    })

    it('does not include robots noindex', () => {
      const meta = getMetaTags('/')
      expect(meta.robots).toBeUndefined()
    })

    it('includes og:type as website', () => {
      const meta = getMetaTags('/')
      expect(meta.og.type).toBe('website')
    })

    it('includes og:url', () => {
      const meta = getMetaTags('/')
      expect(meta.og.url).toBe('https://akli.dev/')
    })

    it('includes og:title matching title', () => {
      const meta = getMetaTags('/')
      expect(meta.og.title).toBe('Akli Aissat — Full-Stack Engineer')
    })

    it('includes og:description matching description', () => {
      const meta = getMetaTags('/')
      expect(meta.og.description).toBe(
        'Full-stack engineer building responsive web applications with React, TypeScript, and modern web technologies. Explore my projects and experiments.'
      )
    })

    it('includes twitter:card as summary', () => {
      const meta = getMetaTags('/')
      expect(meta.twitter.card).toBe('summary')
    })

    it('includes twitter:title matching title', () => {
      const meta = getMetaTags('/')
      expect(meta.twitter.title).toBe('Akli Aissat — Full-Stack Engineer')
    })

    it('includes twitter:description matching description', () => {
      const meta = getMetaTags('/')
      expect(meta.twitter.description).toBe(
        'Full-stack engineer building responsive web applications with React, TypeScript, and modern web technologies. Explore my projects and experiments.'
      )
    })
  })

  describe('apps route /apps', () => {
    it('returns correct title', () => {
      const meta = getMetaTags('/apps')
      expect(meta.title).toBe('Apps & Experiments | Akli Aissat')
    })

    it('returns correct description', () => {
      const meta = getMetaTags('/apps')
      expect(meta.description).toBe(
        'Interactive side projects and experiments built to explore ideas and learn how things work.'
      )
    })

    it('returns correct canonical URL', () => {
      const meta = getMetaTags('/apps')
      expect(meta.canonical).toBe('https://akli.dev/apps')
    })

    it('does not include robots noindex', () => {
      const meta = getMetaTags('/apps')
      expect(meta.robots).toBeUndefined()
    })

    it('includes og:type as website', () => {
      const meta = getMetaTags('/apps')
      expect(meta.og.type).toBe('website')
    })

    it('includes og:url', () => {
      const meta = getMetaTags('/apps')
      expect(meta.og.url).toBe('https://akli.dev/apps')
    })

    it('includes og:title matching title', () => {
      const meta = getMetaTags('/apps')
      expect(meta.og.title).toBe('Apps & Experiments | Akli Aissat')
    })

    it('includes og:description matching description', () => {
      const meta = getMetaTags('/apps')
      expect(meta.og.description).toBe(
        'Interactive side projects and experiments built to explore ideas and learn how things work.'
      )
    })

    it('includes twitter:card as summary', () => {
      const meta = getMetaTags('/apps')
      expect(meta.twitter.card).toBe('summary')
    })

    it('includes twitter:title matching title', () => {
      const meta = getMetaTags('/apps')
      expect(meta.twitter.title).toBe('Apps & Experiments | Akli Aissat')
    })

    it('includes twitter:description matching description', () => {
      const meta = getMetaTags('/apps')
      expect(meta.twitter.description).toBe(
        'Interactive side projects and experiments built to explore ideas and learn how things work.'
      )
    })
  })

  describe('404 / unknown routes', () => {
    it('returns correct title for unknown route', () => {
      const meta = getMetaTags('/nonexistent')
      expect(meta.title).toBe('Page Not Found | Akli Aissat')
    })

    it('returns correct description for unknown route', () => {
      const meta = getMetaTags('/nonexistent')
      expect(meta.description).toBe(
        'The page you are looking for does not exist.'
      )
    })

    it('includes robots noindex for unknown route', () => {
      const meta = getMetaTags('/nonexistent')
      expect(meta.robots).toBe('noindex')
    })

    it('includes og:type as website for 404', () => {
      const meta = getMetaTags('/nonexistent')
      expect(meta.og.type).toBe('website')
    })

    it('includes twitter:card as summary for 404', () => {
      const meta = getMetaTags('/nonexistent')
      expect(meta.twitter.card).toBe('summary')
    })

    it('returns 404 meta for case-sensitive mismatch /Apps', () => {
      const meta = getMetaTags('/Apps')
      expect(meta.title).toBe('Page Not Found | Akli Aissat')
      expect(meta.robots).toBe('noindex')
    })
  })

  describe('trailing slash normalisation', () => {
    it('returns apps meta for /apps/ (trailing slash)', () => {
      const meta = getMetaTags('/apps/')
      expect(meta.title).toBe('Apps & Experiments | Akli Aissat')
    })

    it('returns correct canonical for /apps/ without trailing slash', () => {
      const meta = getMetaTags('/apps/')
      expect(meta.canonical).toBe('https://akli.dev/apps')
    })
  })

  describe('blog index route /blog', () => {
    it('returns correct title', () => {
      const meta = getMetaTags('/blog')
      expect(meta.title).toBe('Blog | Akli Aissat')
    })

    it('returns a description about the blog', () => {
      const meta = getMetaTags('/blog')
      expect(meta.description).toBeTruthy()
      expect(meta.description.length).toBeGreaterThan(10)
    })

    it('does not include robots noindex', () => {
      const meta = getMetaTags('/blog')
      expect(meta.robots).toBeUndefined()
    })

    it('returns correct canonical URL', () => {
      const meta = getMetaTags('/blog')
      expect(meta.canonical).toBe('https://akli.dev/blog')
    })

    it('includes og:type as website', () => {
      const meta = getMetaTags('/blog')
      expect(meta.og.type).toBe('website')
    })

    it('includes twitter:card as summary', () => {
      const meta = getMetaTags('/blog')
      expect(meta.twitter.card).toBe('summary')
    })
  })

  describe('blog post route /blog/<slug>', () => {

    it('returns post title with site suffix', () => {
      const meta = getMetaTags('/blog/test-post')
      expect(meta.title).toBe('Test Post Title | Akli Aissat')
    })

    it('returns post description from frontmatter', () => {
      const meta = getMetaTags('/blog/test-post')
      expect(meta.description).toBe(
        'A test post description for meta tag testing.'
      )
    })

    it('is not marked noindex', () => {
      const meta = getMetaTags('/blog/test-post')
      expect(meta.robots).toBeUndefined()
    })

    it('returns correct canonical URL', () => {
      const meta = getMetaTags('/blog/test-post')
      expect(meta.canonical).toBe('https://akli.dev/blog/test-post')
    })

    it('includes og:type as article', () => {
      const meta = getMetaTags('/blog/test-post')
      expect(meta.og.type).toBe('article')
    })

    it('includes og:image when post has image', () => {
      const meta = getMetaTags('/blog/test-post')
      expect(meta.og.image).toBe('https://akli.dev/images/blog/test-post-cover.jpg')
    })

    it('includes twitter:image when post has image', () => {
      const meta = getMetaTags('/blog/test-post')
      expect(meta.twitter.image).toBe(
        'https://akli.dev/images/blog/test-post-cover.jpg'
      )
    })

    it('sets twitter:card to summary_large_image when post has image', () => {
      const meta = getMetaTags('/blog/test-post')
      expect(meta.twitter.card).toBe('summary_large_image')
    })

    it('sets twitter:card to summary when post has no image', () => {
      const meta = getMetaTags('/blog/no-image-post')
      expect(meta.twitter.card).toBe('summary')
    })

    it('does not include og:image when post has no image', () => {
      const meta = getMetaTags('/blog/no-image-post')
      expect(meta.og.image).toBeUndefined()
    })

    it('does not include twitter:image when post has no image', () => {
      const meta = getMetaTags('/blog/no-image-post')
      expect(meta.twitter.image).toBeUndefined()
    })
  })

  describe('blog post 404 /blog/nonexistent-slug', () => {
    it('returns 404 title for nonexistent post', () => {
      const meta = getMetaTags('/blog/nonexistent-slug')
      expect(meta.title).toBe('Page Not Found | Akli Aissat')
    })

    it('returns 404 description for nonexistent post', () => {
      const meta = getMetaTags('/blog/nonexistent-slug')
      expect(meta.description).toBe(
        'The page you are looking for does not exist.'
      )
    })

    it('includes robots noindex for nonexistent post', () => {
      const meta = getMetaTags('/blog/nonexistent-slug')
      expect(meta.robots).toBe('noindex')
    })
  })

  describe('recipe detail route /recipes/<slug> with recipe data', () => {
    const mockRecipe = {
      id: 'r1',
      title: 'Spaghetti Bolognese',
      slug: 'spaghetti-bolognese',
      coverImage: { key: 'recipes/spaghetti-bolognese/cover', alt: 'A bowl of spaghetti bolognese' },
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
        { order: 1, text: 'Boil the pasta.' },
        { order: 2, text: 'Brown the mince.' },
      ],
      authorId: 'a1',
      authorName: 'Akli Aissat',
      updatedAt: '2026-03-02T10:00:00Z',
      status: 'published',
    }

    const longIntroRecipe = {
      ...mockRecipe,
      slug: 'long-intro-recipe',
      intro:
        'This is a very long introduction that exceeds one hundred and sixty characters in length so we can verify that the description is properly truncated when generating Open Graph meta tags for social sharing previews on various platforms.',
    }

    it('returns og:title matching the recipe title', () => {
      const meta = getMetaTags('/recipes/spaghetti-bolognese', { recipe: mockRecipe })
      expect(meta.og.title).toBe('Spaghetti Bolognese | Akli Aissat')
    })

    it('returns og:description from the recipe intro', () => {
      const meta = getMetaTags('/recipes/spaghetti-bolognese', { recipe: mockRecipe })
      expect(meta.og.description).toBe('A classic Italian pasta dish with rich meat sauce.')
    })

    it('returns og:description truncated to 160 chars when intro is longer', () => {
      const meta = getMetaTags('/recipes/long-intro-recipe', { recipe: longIntroRecipe })
      expect(meta.og.description.length).toBeLessThanOrEqual(160)
    })

    it('returns og:image as the absolute images.akli.dev URL for the cover medium variant', () => {
      const meta = getMetaTags('/recipes/spaghetti-bolognese', { recipe: mockRecipe })
      expect(meta.og.image).toBe('https://images.akli.dev/recipes/spaghetti-bolognese/cover-medium.webp')
    })

    it('returns og:type as article', () => {
      const meta = getMetaTags('/recipes/spaghetti-bolognese', { recipe: mockRecipe })
      expect(meta.og.type).toBe('article')
    })

    it('returns twitter:card as summary_large_image', () => {
      const meta = getMetaTags('/recipes/spaghetti-bolognese', { recipe: mockRecipe })
      expect(meta.twitter.card).toBe('summary_large_image')
    })

    it('returns twitter:title matching the recipe title', () => {
      const meta = getMetaTags('/recipes/spaghetti-bolognese', { recipe: mockRecipe })
      expect(meta.twitter.title).toBe('Spaghetti Bolognese | Akli Aissat')
    })

    it('returns twitter:description from the recipe intro', () => {
      const meta = getMetaTags('/recipes/spaghetti-bolognese', { recipe: mockRecipe })
      expect(meta.twitter.description).toBe('A classic Italian pasta dish with rich meat sauce.')
    })

    it('returns twitter:image as the absolute images.akli.dev URL for the cover medium variant', () => {
      const meta = getMetaTags('/recipes/spaghetti-bolognese', { recipe: mockRecipe })
      expect(meta.twitter.image).toBe('https://images.akli.dev/recipes/spaghetti-bolognese/cover-medium.webp')
    })
  })
})

describe('isKnownRoute', () => {
  it('recognises /recipes/:slug pattern', () => {
    expect(isKnownRoute('/recipes/some-slug')).toBe(true)
  })

  it('returns true for /admin/login', () => {
    expect(isKnownRoute('/admin/login')).toBe(true)
  })

  it('returns true for /admin/recipes', () => {
    expect(isKnownRoute('/admin/recipes')).toBe(true)
  })

  it('returns true for /admin/recipes/new', () => {
    expect(isKnownRoute('/admin/recipes/new')).toBe(true)
  })

  it('returns true for /admin/recipes/:id/edit', () => {
    expect(isKnownRoute('/admin/recipes/some-id/edit')).toBe(true)
  })

  it('returns true for /admin/recipes/:id/preview', () => {
    expect(isKnownRoute('/admin/recipes/some-id/preview')).toBe(true)
  })

  it('returns true for /admin/users', () => {
    expect(isKnownRoute('/admin/users')).toBe(true)
  })
})
