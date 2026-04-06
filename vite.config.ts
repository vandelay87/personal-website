import mdx from '@mdx-js/rollup'
import rehypeShiki from '@shikijs/rehype'
import react from '@vitejs/plugin-react'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import { imagetools } from 'vite-imagetools'
import { defineConfig } from 'vitest/config'
import remarkReadingTime from './plugins/remark-reading-time'
import { sitemapPlugin } from './sitemap-plugin'

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [
    react(),
    mdx({
      remarkPlugins: [
        remarkFrontmatter,
        [remarkMdxFrontmatter, { name: 'frontmatter' }],
        remarkReadingTime,
      ],
      rehypePlugins: [
        [rehypeShiki, {
          themes: { light: 'github-light', dark: 'github-dark' },
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
            exclude: ['**/*.test.*', '**/*.spec.*', '**/NotFound.*', '**/*test*'],
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
            ],
          }),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@components': '/src/components',
      '@pages': '/src/pages',
      '@hooks': '/src/hooks',
    },
  },
  ssr: {
    noExternal: true,
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
}))
