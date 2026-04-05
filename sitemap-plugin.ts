import { statSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import { glob } from 'glob'
import { Plugin } from 'vite'

interface RouteConfig {
  priority?: number
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  lastmod?: string
}

interface AdditionalRoute {
  route: string
  priority?: number
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
}

interface SitemapOptions {
  hostname: string
  pagesDir?: string
  exclude?: string[]
  include?: string[]
  defaultChangefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  defaultPriority?: number
  routeConfig?: Record<string, RouteConfig>
  routeMapping?: Record<string, string>
  additionalRoutes?: AdditionalRoute[]
}

export function sitemapPlugin(options: SitemapOptions): Plugin {
  const {
    hostname,
    pagesDir = 'src/pages',
    exclude = [],
    include = ['**/*.tsx', '**/*.ts'],
    defaultChangefreq = 'monthly',
    defaultPriority = 0.5,
    routeConfig = {},
    routeMapping = {},
    additionalRoutes = [],
  } = options

  return {
    name: 'sitemap-plugin',
    async writeBundle() {
      try {
        const discoveredRoutes = await discoverRoutes(pagesDir, include, exclude, routeMapping)

        const allRoutes: Array<{ route: string; filePath?: string }> = [
          ...discoveredRoutes,
          ...additionalRoutes.map(({ route, priority, changefreq }) => {
            // Store priority/changefreq in routeConfig so generateSitemap picks them up
            if (priority !== undefined || changefreq !== undefined) {
              routeConfig[route] = {
                ...routeConfig[route],
                ...(priority !== undefined && { priority }),
                ...(changefreq !== undefined && { changefreq }),
              }
            }
            return { route }
          }),
        ]

        const sitemap = generateSitemap(
          hostname,
          allRoutes,
          defaultChangefreq,
          defaultPriority,
          routeConfig
        )
        const sitemapPath = resolve('dist', 'sitemap.xml')
        writeFileSync(sitemapPath, sitemap)
        console.log(`✅ Sitemap generated with ${allRoutes.length} routes`)
      } catch (error) {
        console.error('❌ Failed to generate sitemap:', error)
      }
    },
  }
}

async function discoverRoutes(
  pagesDir: string,
  include: string[],
  exclude: string[],
  routeMapping: Record<string, string>
): Promise<Array<{ route: string; filePath: string }>> {
  const routes: Array<{ route: string; filePath: string }> = []

  try {
    const patterns = include.map((pattern) => `${pagesDir}/${pattern}`)
    const files = await glob(patterns, { ignore: exclude })

    for (const file of files) {
      const route = fileToRoute(file, pagesDir, routeMapping)
      if (route && !routes.find((r) => r.route === route)) {
        routes.push({ route, filePath: file })
      }
    }
  } catch (error) {
    console.warn('Could not discover routes automatically:', error)
  }

  return routes
}

function fileToRoute(
  filePath: string,
  pagesDir: string,
  routeMapping: Record<string, string>
): string | null {
  // Normalize path separators to forward slashes
  const normalizedFilePath = filePath.replace(/\\/g, '/')
  const normalizedPagesDir = pagesDir.replace(/\\/g, '/')

  // Remove pages directory prefix and file extension
  let route = normalizedFilePath
    .replace(new RegExp(`^${normalizedPagesDir.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), '')
    .replace(/\.(tsx?|jsx?)$/, '')

  // Remove leading slash if present
  if (route.startsWith('/')) {
    route = route.substring(1)
  }

  // Split into segments and process
  const segments = route.split('/').filter(Boolean)

  // Handle different file naming conventions
  let processedSegments: string[] = []

  if (segments.length === 0) {
    // Root index file
    route = '/'
  } else if (segments.length === 1) {
    // Single segment: Home.tsx -> /home
    processedSegments = [segments[0]]
  } else if (segments.length === 2 && segments[0].toLowerCase() === segments[1].toLowerCase()) {
    // Duplicate segments: Home/Home.tsx -> /home
    processedSegments = [segments[0]]
  } else if (segments[segments.length - 1] === 'index') {
    // Index file: About/index.tsx -> /about
    processedSegments = segments.slice(0, -1)
  } else {
    // Default case: keep all segments
    processedSegments = segments
  }

  // Build the final route
  if (processedSegments.length === 0) {
    route = '/'
  } else {
    route = '/' + processedSegments.join('/')
  }

  // Convert dynamic routes (Next.js style)
  route = route.replace(/\[([^\]]+)\]/g, ':$1')

  // Convert to lowercase for URLs
  route = route.toLowerCase()

  // Apply custom route mapping after lowercase conversion
  if (routeMapping[route]) {
    route = routeMapping[route]
  }

  return route
}

export function generateSitemap(
  hostname: string,
  routes: Array<{ route: string; filePath?: string }>,
  defaultChangefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never',
  defaultPriority: number,
  routeConfig: Record<string, RouteConfig>
): string {
  const urls = routes
    .map(({ route, filePath }) => {
      const config = routeConfig[route] || {}

      // Default priority logic: home page gets 1.0, others get default or configured priority
      const priority =
        config.priority !== undefined ? config.priority : route === '/' ? 1.0 : defaultPriority

      const changefreq = config.changefreq || defaultChangefreq

      // Use file modification time if no explicit lastmod is configured
      let lastmod = config.lastmod
      if (!lastmod) {
        if (filePath) {
          try {
            const stats = statSync(filePath)
            lastmod = stats.mtime.toISOString().split('T')[0]
          } catch {
            // Fallback to current date if file stat fails
            lastmod = new Date().toISOString().split('T')[0]
          }
        } else {
          // No file path (e.g., additional routes) — use current date
          lastmod = new Date().toISOString().split('T')[0]
        }
      }

      return `  <url>
    <loc>${hostname}${route}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`
}
