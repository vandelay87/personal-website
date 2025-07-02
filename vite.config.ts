import mdx from '@mdx-js/rollup'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { sitemapPlugin } from './sitemap-plugin'

export default defineConfig({
  plugins: [
    react(),
    mdx(),
    tailwindcss(),
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
        '/about': {
          priority: 0.8,
          changefreq: 'monthly',
        },
      },
      defaultPriority: 0.5,
      defaultChangefreq: 'monthly',
    }),
  ],
  resolve: {
    alias: {
      '@components': '/src/components',
      '@pages': '/src/pages',
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
})
