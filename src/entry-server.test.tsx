// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { render } from './entry-server'

describe('entry-server render', () => {
  describe('home page /', () => {
    it('returns non-empty HTML', () => {
      const html = render('/')
      expect(html).toBeTruthy()
      expect(html.length).toBeGreaterThan(0)
    })

    it('contains the correct <title> tag', () => {
      const html = render('/')
      expect(html).toContain(
        '<title>Akli Aissat — Full-Stack Engineer</title>'
      )
    })

    it('contains OG meta tags', () => {
      const html = render('/')
      expect(html).toContain('property="og:title"')
      expect(html).toContain('property="og:description"')
      expect(html).toContain('property="og:type"')
      expect(html).toContain('property="og:url"')
    })

    it('contains twitter meta tags', () => {
      const html = render('/')
      expect(html).toContain('name="twitter:card"')
      expect(html).toContain('name="twitter:title"')
      expect(html).toContain('name="twitter:description"')
    })

    it('contains the root div with content inside', () => {
      const html = render('/')
      expect(html).toContain('<div id="root">')
      // The root div should not be empty — it should have rendered content
      expect(html).not.toContain('<div id="root"></div>')
    })
  })

  describe('apps page /apps', () => {
    it('returns non-empty HTML', () => {
      const html = render('/apps')
      expect(html).toBeTruthy()
      expect(html.length).toBeGreaterThan(0)
    })

    it('contains the correct <title> tag', () => {
      const html = render('/apps')
      expect(html).toContain(
        '<title>Apps &amp; Experiments | Akli Aissat</title>'
      )
    })

    it('contains OG meta tags', () => {
      const html = render('/apps')
      expect(html).toContain('property="og:title"')
      expect(html).toContain('property="og:description"')
    })

    it('contains the root div with content inside', () => {
      const html = render('/apps')
      expect(html).toContain('<div id="root">')
      expect(html).not.toContain('<div id="root"></div>')
    })
  })

  describe('canonical link', () => {
    it('includes canonical link for /', () => {
      const html = render('/')
      expect(html).toContain('rel="canonical"')
      expect(html).toContain('href="https://akli.dev/"')
    })

    it('includes canonical link for /apps', () => {
      const html = render('/apps')
      expect(html).toContain('rel="canonical"')
      expect(html).toContain('href="https://akli.dev/apps"')
    })
  })
})
