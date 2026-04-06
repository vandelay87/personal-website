// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getMetaTags, normalisePath, escapeHtml } from './meta'
import type { MetaTags } from './meta'

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
    const testPost = {
      title: 'Test Post Title',
      date: '2025-01-15',
      description: 'A test post description for meta tag testing.',
      tags: ['testing'],
      slug: 'test-post',
      readingTime: 3,
      image: '/images/blog/test-post-cover.jpg',
    }

    const testPostNoImage = {
      title: 'No Image Post',
      date: '2025-02-01',
      description: 'A post without an image.',
      tags: ['testing'],
      slug: 'no-image-post',
      readingTime: 2,
    }

    beforeEach(() => {
      vi.doMock('./pages/Blog/posts/index', () => ({
        posts: [testPost, testPostNoImage],
        getPost: (slug: string) =>
          [testPost, testPostNoImage].find((p) => p.slug === slug),
      }))
    })

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
})
