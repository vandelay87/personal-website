import { describe, expect, it, vi } from 'vitest'
import { generateSitemap } from './sitemap-plugin'

// Mock statSync so it doesn't try to access real files
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>()
  return {
    ...actual,
    statSync: vi.fn(() => ({
      mtime: new Date('2025-01-15'),
    })),
  }
})

describe('generateSitemap', () => {
  it('includes additional routes without filePath', () => {
    const routes = [
      { route: '/', filePath: 'src/pages/Home/Home.tsx' },
      { route: '/apps', filePath: 'src/pages/Apps/Apps.tsx' },
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
      { route: '/', filePath: 'src/pages/Home/Home.tsx' },
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
      { route: '/', filePath: 'src/pages/Home/Home.tsx' },
      { route: '/blog', filePath: 'src/pages/Blog/Blog.tsx' },
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
      { route: '/', filePath: 'src/pages/Home/Home.tsx' },
      { route: '/apps', filePath: 'src/pages/Apps/Apps.tsx' },
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
