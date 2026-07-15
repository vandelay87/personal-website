import { readFileSync, readdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import mdx from '@mdx-js/rollup'
import rehypeShiki from '@shikijs/rehype'
import type { ShikiTransformer } from '@shikijs/types'
import react from '@vitejs/plugin-react'
import rehypeMermaid from 'rehype-mermaid'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import { loadEnv, type Plugin } from 'vite'
import { imagetools } from 'vite-imagetools'
import { defineConfig } from 'vitest/config'
import remarkReadingTime from './plugins/remark-reading-time'
import { sitemapPlugin } from './sitemap-plugin'

const rootDir = dirname(fileURLToPath(import.meta.url))

// Vite's dev server never runs SSR on its own — it serves the static index.html
// with <!--ssr-outlet--> unrendered, which produces a hydration mismatch on the
// first real DOM node. This renders the app for real, the same way the Lambda
// handler does in production, using Vite's own transformed HTML template so
// HMR/client scripts keep working.
const ssrDevServerPlugin = (): Plugin => ({
  name: 'ssr-dev-server',
  configureServer(server) {
    return () => {
      server.middlewares.use(async (req, res, next) => {
        const url = req.originalUrl

        if (
          !url ||
          req.method !== 'GET' ||
          url.startsWith('/@') ||
          url.startsWith('/src/') ||
          url.startsWith('/node_modules/') ||
          /\.[^/?]+$/.test(url.split('?')[0])
        ) {
          next()
          return
        }

        try {
          const rawHtml = readFileSync(join(rootDir, 'index.html'), 'utf-8')
          const transformedHtml = await server.transformIndexHtml(url, rawHtml)
          const { render } = await server.ssrLoadModule('/src/entry-server.tsx')
          const html = await render(url, undefined, transformedHtml)

          res.statusCode = 200
          res.setHeader('Content-Type', 'text/html')
          res.end(html)
        } catch (error) {
          server.ssrFixStacktrace(error as Error)
          next(error)
        }
      })
    }
  },
})

const getBlogRoutes = (): Array<{ route: string; priority: number; changefreq: 'monthly' }> => {
  const postsDir = join(rootDir, 'src/pages/Blog/posts')
  try {
    const files = readdirSync(postsDir)
    return files
      .filter((file) => file.endsWith('.mdx'))
      .map((file) => ({
        route: `/blog/${file.replace('.mdx', '')}`,
        priority: 0.6,
        changefreq: 'monthly' as const,
      }))
  } catch {
    return []
  }
}

export default defineConfig(({ command, isSsrBuild, mode }) => {
  const env = loadEnv(mode, rootDir, '')
  return {
  plugins: [
    react(),
    ssrDevServerPlugin(),
    mdx({
      remarkPlugins: [
        remarkFrontmatter,
        [remarkMdxFrontmatter, { name: 'frontmatter' }],
        remarkReadingTime,
      ],
      rehypePlugins: [
        [rehypeMermaid, {
          strategy: 'inline-svg',
          mermaidConfig: {
            theme: 'neutral',
          },
        }],
        [rehypeShiki, {
          themes: { light: 'github-light', dark: 'github-dark' },
          defaultColor: false,
          cssVariablePrefix: '--shiki-',
          transformers: [{
            name: 'preserve-meta',
            pre(node) {
              if (this.options.meta?.__raw) {
                node.properties['data-meta'] = this.options.meta.__raw
              }
            },
          } satisfies ShikiTransformer],
        }],
      ],
    }),
    imagetools(),
    ...(!isSsrBuild
      ? [
          sitemapPlugin({
            hostname: 'https://akli.dev',
            pagesDir: 'src/pages',
            include: ['**/*.tsx'],
            exclude: ['**/*.test.*', '**/*.spec.*', '**/NotFound.*', '**/*test*', '**/BlogPost.*'],
            routeMapping: {
              '/home': '/',
            },
            routeConfig: {
              '/': {
                priority: 1.0,
                changefreq: 'monthly',
              },
              '/apps': {
                priority: 0.8,
                changefreq: 'monthly',
              },
            },
            defaultPriority: 0.5,
            defaultChangefreq: 'monthly',
            additionalRoutes: [
              { route: '/apps/pokedex', priority: 0.7, changefreq: 'monthly' },
              ...getBlogRoutes(),
            ],
          }),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@api': '/src/api',
      '@components': '/src/components',
      '@contexts': '/src/contexts',
      '@hooks': '/src/hooks',
      '@pages': '/src/pages',
      '@models': '/src/types',
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://api.akli.dev',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      ...(env.VITE_S3_BUCKET_HOST && {
        '/s3-upload': {
          target: `https://${env.VITE_S3_BUCKET_HOST}`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/s3-upload/, ''),
        },
      }),
    },
  },
  ssr: {
    // Bundle deps for production builds (a single CJS file for Lambda, with
    // no node_modules) and for Vitest, which also resolves through this
    // config with command === 'serve' (it calls Vite's createServer()
    // internally) but defaults `mode` to 'test' — forcing noExternal there
    // matches production's bundled path and preserves prior test coverage.
    // Only the real interactive dev server (mode === 'development') gets
    // noExternal: undefined, since Vite's dev-mode ssrLoadModule, run live
    // over HTTP, breaks when packages like React's dev runtime are forced
    // through Vite's SSR transform pipeline instead of externalized/required
    // from node_modules, on their `typeof module` CJS-interop checks.
    noExternal: command === 'build' || mode === 'test' ? true : undefined,
    external: ['node:fs', 'node:path'],
  },
  build: {
    rollupOptions: {
      output: {
        ...(isSsrBuild && {
          entryFileNames: 'index.js',
          format: 'cjs',
        }),
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
  }
})
