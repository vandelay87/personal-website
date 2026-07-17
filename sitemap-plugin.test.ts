import { mkdtempSync, rmSync, utimesSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { generateSitemap } from './sitemap-plugin'

describe('generateSitemap', () => {
  // Uses a real file in a real temp directory rather than mocking `fs` —
  // this is a root-level module outside src/, and Vitest's module mocking
  // doesn't reliably intercept `fs` calls made from those (confirmed by
  // hand: a `vi.mock('fs', ...)` in this file never reached the real
  // statSync call inside generateSitemap, even with `node:fs` also mocked).
  // plugins/blog-posts-meta.test.ts hit the same issue and uses the same
  // real-temp-file pattern.
  let tempDir: string
  let filePath: string
  const pinnedDate = new Date('2025-01-15T00:00:00.000Z')

  beforeAll(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'sitemap-plugin-test-'))
    filePath = join(tempDir, 'Home.tsx')
    writeFileSync(filePath, 'export const Home = () => null')
    utimesSync(filePath, pinnedDate, pinnedDate)
  })

  afterAll(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  it('uses the file mtime as lastmod when a filePath is provided', () => {
    const routes = [{ route: '/', filePath }]
    const routeConfig = { '/': { priority: 1.0, changefreq: 'monthly' as const } }

    const sitemap = generateSitemap('https://akli.dev', routes, 'monthly', 0.5, routeConfig)

    expect(sitemap).toContain('<lastmod>2025-01-15</lastmod>')
  })

  it('falls back to the current date when statSync throws for a nonexistent filePath', () => {
    const routes = [{ route: '/apps', filePath: join(tempDir, 'does-not-exist.tsx') }]

    const sitemap = generateSitemap('https://akli.dev', routes, 'monthly', 0.5, {})

    const today = new Date().toISOString().split('T')[0]
    expect(sitemap).toContain(`<lastmod>${today}</lastmod>`)
  })

  it('includes additional routes without filePath', () => {
    const routes = [
      { route: '/', filePath },
      { route: '/apps', filePath },
      { route: '/apps/pokedex' }, // additional route, no filePath
    ]

    const routeConfig = {
      '/': { priority: 1.0, changefreq: 'monthly' as const },
      '/apps': { priority: 0.8, changefreq: 'monthly' as const },
      '/apps/pokedex': { priority: 0.7, changefreq: 'monthly' as const },
    }

    const sitemap = generateSitemap('https://akli.dev', routes, 'monthly', 0.5, routeConfig)

    expect(sitemap).toContain('<loc>https://akli.dev/apps/pokedex</loc>')
    expect(sitemap).toContain('<priority>0.7</priority>')
  })

  it('includes /apps/pokedex with correct priority and changefreq', () => {
    const routes = [
      { route: '/', filePath },
      { route: '/apps/pokedex' },
    ]

    const routeConfig = {
      '/apps/pokedex': { priority: 0.7, changefreq: 'monthly' as const },
    }

    const sitemap = generateSitemap('https://akli.dev', routes, 'weekly', 0.5, routeConfig)

    // Extract the pokedex URL block
    const pokedexUrlMatch = sitemap.match(/<url>\s*<loc>https:\/\/akli\.dev\/apps\/pokedex<\/loc>[\s\S]*?<\/url>/)
    expect(pokedexUrlMatch).not.toBeNull()

    const pokedexBlock = pokedexUrlMatch![0]
    expect(pokedexBlock).toContain('<changefreq>monthly</changefreq>')
    expect(pokedexBlock).toContain('<priority>0.7</priority>')
    expect(pokedexBlock).toContain('<lastmod>')
  })

  it('uses current date as lastmod for routes without filePath', () => {
    const routes = [{ route: '/apps/pokedex' }]
    const routeConfig = {
      '/apps/pokedex': { priority: 0.7, changefreq: 'monthly' as const },
    }

    const sitemap = generateSitemap('https://akli.dev', routes, 'monthly', 0.5, routeConfig)

    const today = new Date().toISOString().split('T')[0]
    expect(sitemap).toContain(`<lastmod>${today}</lastmod>`)
  })

  it('includes blog post routes in sitemap', () => {
    const routes = [
      { route: '/', filePath },
      { route: '/blog', filePath },
      { route: '/blog/test-post' },
    ]

    const routeConfig = {
      '/blog/test-post': { priority: 0.6, changefreq: 'monthly' as const },
    }

    const sitemap = generateSitemap('https://akli.dev', routes, 'monthly', 0.5, routeConfig)

    expect(sitemap).toContain('<loc>https://akli.dev/blog</loc>')
    expect(sitemap).toContain('<loc>https://akli.dev/blog/test-post</loc>')

    const blogPostMatch = sitemap.match(/<url>\s*<loc>https:\/\/akli\.dev\/blog\/test-post<\/loc>[\s\S]*?<\/url>/)
    expect(blogPostMatch).not.toBeNull()

    const blogPostBlock = blogPostMatch![0]
    expect(blogPostBlock).toContain('<priority>0.6</priority>')
    expect(blogPostBlock).toContain('<changefreq>monthly</changefreq>')
  })

  it('does not break existing routes with filePath', () => {
    const routes = [
      { route: '/', filePath },
      { route: '/apps', filePath },
    ]

    const routeConfig = {
      '/': { priority: 1.0, changefreq: 'monthly' as const },
    }

    const sitemap = generateSitemap('https://akli.dev', routes, 'monthly', 0.5, routeConfig)

    expect(sitemap).toContain('<loc>https://akli.dev/</loc>')
    expect(sitemap).toContain('<loc>https://akli.dev/apps</loc>')
    expect(sitemap).toContain('<?xml version="1.0" encoding="UTF-8"?>')
  })
})
