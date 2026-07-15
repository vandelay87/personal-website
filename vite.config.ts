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
import { isCSSRequest, loadEnv, type ModuleNode, type Plugin, type ViteDevServer } from 'vite'
import { imagetools } from 'vite-imagetools'
import { defineConfig } from 'vitest/config'
import remarkReadingTime from './plugins/remark-reading-time'
import { sitemapPlugin } from './sitemap-plugin'

const rootDir = dirname(fileURLToPath(import.meta.url))

// Recursively walks the dev module graph from `mod`, collecting every
// CSS(-Modules) module transitively imported (statically or dynamically).
// Dedupes by URL rather than object identity, since Vite's ModuleNode is a
// "backward compatible" view that may hand back distinct wrapper objects
// for the same underlying module across separate lookups.
const collectCssModules = (
  mod: ModuleNode | undefined,
  visited: Set<string> = new Set(),
  cssModules: Map<string, ModuleNode> = new Map()
): Map<string, ModuleNode> => {
  if (!mod || visited.has(mod.url)) return cssModules
  visited.add(mod.url)

  if (isCSSRequest(mod.url)) {
    cssModules.set(mod.url, mod)
  }

  for (const imported of mod.importedModules) {
    collectCssModules(imported, visited, cssModules)
  }

  return cssModules
}

// Vite dev mode never emits a blocking <link rel="stylesheet"> for CSS
// Modules — it transforms them into JS that injects a <style> tag as a side
// effect of the importing module executing on the client. Before this file's
// SSR middleware existed that was invisible: pnpm dev never painted real
// content before client JS ran, so there was nothing to flash. Now that we
// SSR real markup, the browser paints real class names immediately while the
// rules for them are still absent until the client bundle executes each
// CSS-module import — a visible flash of unstyled content.
//
// The fix (Vite's documented dev-SSR CSS-collection pattern): after
// rendering, walk the module graph for every CSS module transitively
// imported by the SSR entry, fetch each one's real transformed CSS text, and
// inline it as a <style> block in <head> so first paint is already styled.
// The dev-mode JS-injected <style> tags still land later — harmless
// redundant styling, since by then nothing is left to visually flash.
//
// SSR-transformed CSS modules only export the class-name map (dev mode's
// css-post plugin returns `modulesCode || 'export {}'` for SSR consumers —
// no CSS text), so `ssrModule` can't supply the text. Instead we re-request
// each module's URL with Vite's own `?direct` marker, which is exactly what
// the dev server itself appends for CSS requested via <link> instead of a
// JS import — it makes the css-post plugin skip the JS-injection wrapper and
// return the real processed CSS text.
const collectInlineStyles = async (
  server: ViteDevServer,
  entryUrl: string
): Promise<string> => {
  // Purely cosmetic anti-FOUC enhancement — render() has already produced
  // valid markup by the time this runs, so any failure here (e.g. a single
  // CSS module failing to transform) must degrade to the unstyled HTML
  // rather than propagate to the middleware's outer catch, which would send
  // an otherwise-successful render to Vite's error overlay.
  try {
    const entryMod = await server.moduleGraph.getModuleByUrl(entryUrl)
    const cssModules = collectCssModules(entryMod)

    // index.css is entry-client.tsx's global stylesheet (tokens, fonts,
    // resets, @layer ordering) — entry-server.tsx never imports it, since
    // production SSR relies on the built <link> stylesheet for it instead.
    // The dev module graph walk above starts from entry-server.tsx, so it
    // never reaches index.css, and every component CSS Module's var(--...)
    // references resolve to nothing without it — the exact "unstyled" look
    // reported, despite component-level CSS already being inlined correctly.
    const cssUrls = new Set([...cssModules.keys(), '/src/index.css'])

    const cssTexts = await Promise.all(
      [...cssUrls].map(async (url) => {
        const directUrl = url.includes('?') ? `${url}&direct` : `${url}?direct`
        // No { ssr: true } here despite this module being found via the SSR
        // module graph — passing it makes Vite route ?direct CSS requests
        // through ssrTransformScript (a JS parser) instead of the CSS
        // pipeline, throwing on every module. Confirmed by isolation test;
        // the default client-environment transform is what actually works.
        const result = await server.transformRequest(directUrl)
        return result?.code ?? ''
      })
    )

    const css = cssTexts.filter(Boolean).join('\n')
    return css ? `<style data-vite-dev-ssr-inline>${css}</style>` : ''
  } catch (error) {
    console.warn('[ssr-dev-server] Failed to collect inline styles, falling back to unstyled HTML:', error)
    return ''
  }
}

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
        const acceptsHtml = req.headers.accept?.includes('text/html')

        if (
          !url ||
          req.method !== 'GET' ||
          !acceptsHtml ||
          url.startsWith('/@') ||
          url.startsWith('/src/') ||
          url.startsWith('/node_modules/')
        ) {
          next()
          return
        }

        try {
          const rawHtml = readFileSync(join(rootDir, 'index.html'), 'utf-8')
          const [transformedHtml, { render }] = await Promise.all([
            server.transformIndexHtml(url, rawHtml),
            server.ssrLoadModule('/src/entry-server.tsx'),
          ])
          // Sequenced, not parallelized: admin routes are React.lazy(), so
          // their module (and its CSS) only lands in the module graph once
          // render() actually reaches and awaits that Suspense boundary.
          // Collecting styles concurrently with render() would race that.
          const html = await render(url, undefined, transformedHtml)
          const inlineStyles = await collectInlineStyles(server, '/src/entry-server.tsx')
          const htmlWithStyles = inlineStyles
            ? html.replace('</head>', `${inlineStyles}</head>`)
            : html

          res.statusCode = 200
          res.setHeader('Content-Type', 'text/html')
          res.end(htmlWithStyles)
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
    // internally) — forcing noExternal there matches production's bundled
    // path and preserves prior test coverage. `process.env.VITEST` is the
    // reliable Vitest-detection signal here (Vitest always sets it), unlike
    // `mode`, which is a general Vite concept a real dev server run could
    // also set to 'test' (e.g. `vite dev --mode test` for a `.env.test`
    // file) without being Vitest at all. The real interactive dev server
    // gets noExternal: undefined, since Vite's dev-mode ssrLoadModule, run
    // live over HTTP, breaks when packages like React's dev runtime are
    // forced through Vite's SSR transform pipeline instead of
    // externalized/required from node_modules, on their `typeof module`
    // CJS-interop checks.
    noExternal: command === 'build' || process.env.VITEST ? true : undefined,
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
