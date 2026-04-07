// @vitest-environment node
import { describe, it, expect, vi } from 'vitest'
import { render } from './entry-server'

describe('entry-server render', () => {
  describe('home page /', () => {
    it('returns non-empty HTML', async () => {
      const html = await render('/')
      expect(html).toBeTruthy()
      expect(html.length).toBeGreaterThan(0)
    })

    it('contains the correct <title> tag', async () => {
      const html = await render('/')
      expect(html).toContain(
        '<title>Akli Aissat — Full-Stack Engineer</title>'
      )
    })

    it('contains OG meta tags', async () => {
      const html = await render('/')
      expect(html).toContain('property="og:title"')
      expect(html).toContain('property="og:description"')
      expect(html).toContain('property="og:type"')
      expect(html).toContain('property="og:url"')
    })

    it('contains twitter meta tags', async () => {
      const html = await render('/')
      expect(html).toContain('name="twitter:card"')
      expect(html).toContain('name="twitter:title"')
      expect(html).toContain('name="twitter:description"')
    })

    it('contains the root div with content inside', async () => {
      const html = await render('/')
      expect(html).toContain('<div id="root">')
      // The root div should not be empty — it should have rendered content
      expect(html).not.toContain('<div id="root"></div>')
    })
  })

  describe('apps page /apps', () => {
    it('returns non-empty HTML', async () => {
      const html = await render('/apps')
      expect(html).toBeTruthy()
      expect(html.length).toBeGreaterThan(0)
    })

    it('contains the correct <title> tag', async () => {
      const html = await render('/apps')
      expect(html).toContain(
        '<title>Apps &amp; Experiments | Akli Aissat</title>'
      )
    })

    it('contains OG meta tags', async () => {
      const html = await render('/apps')
      expect(html).toContain('property="og:title"')
      expect(html).toContain('property="og:description"')
    })

    it('contains the root div with content inside', async () => {
      const html = await render('/apps')
      expect(html).toContain('<div id="root">')
      expect(html).not.toContain('<div id="root"></div>')
    })
  })

  describe('blog index page /blog', () => {
    it('returns non-empty HTML', async () => {
      const html = await render('/blog')
      expect(html).toBeTruthy()
      expect(html.length).toBeGreaterThan(0)
    })

    it('contains the correct <title> tag', async () => {
      const html = await render('/blog')
      expect(html).toContain('<title>Blog | Akli Aissat</title>')
    })
  })

  describe('canonical link', () => {
    it('includes canonical link for /', async () => {
      const html = await render('/')
      expect(html).toContain('rel="canonical"')
      expect(html).toContain('href="https://akli.dev/"')
    })

    it('includes canonical link for /apps', async () => {
      const html = await render('/apps')
      expect(html).toContain('rel="canonical"')
      expect(html).toContain('href="https://akli.dev/apps"')
    })
  })

  describe('blog post /blog/building-a-pokedex', () => {
    it('renders full blog post content without Suspense fallback', async () => {
      const html = await render('/blog/building-a-pokedex')
      // The actual blog post content should be present, not the fallback
      expect(html).not.toContain('>Loading...</')
      // Real content from the blog post should be in the HTML
      expect(html).toContain('Pokedex')
    })

    it('contains blog-post-specific meta tags', async () => {
      const html = await render('/blog/building-a-pokedex')
      expect(html).toContain(
        '<title>Building a Pokedex with React and AWS | Akli Aissat</title>'
      )
      expect(html).toContain('property="og:title"')
      expect(html).toContain('Building a Pokedex with React and AWS')
      expect(html).toContain('property="og:type" content="article"')
      expect(html).toContain(
        'href="https://akli.dev/blog/building-a-pokedex"'
      )
    })

    it('contains OG image for blog post with image', async () => {
      const html = await render('/blog/building-a-pokedex')
      expect(html).toContain('property="og:image"')
      expect(html).toContain('/images/blog/pokedex-desktop.webp')
    })

    it('contains twitter large image card for blog post with image', async () => {
      const html = await render('/blog/building-a-pokedex')
      expect(html).toContain('name="twitter:card" content="summary_large_image"')
      expect(html).toContain('name="twitter:image"')
    })
  })

  describe('error handling', () => {
    it('rejects or signals an error when the render crashes', async () => {
      vi.resetModules()

      vi.doMock('./App', () => ({
        default: () => {
          throw new Error('Simulated render crash')
        },
      }))

      const { render: renderWithError } = await import('./entry-server')

      await expect(renderWithError('/')).rejects.toThrow()

      vi.doUnmock('./App')
      vi.resetModules()
    })
  })
})
