// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { getMetaTags, normalisePath, escapeHtml } from './meta'

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
})
