import { readdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import mdx from '@mdx-js/rollup'
import rehypeShiki from '@shikijs/rehype'
import react from '@vitejs/plugin-react'
import rehypeMermaid from 'rehype-mermaid'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import { loadEnv } from 'vite'
import { imagetools } from 'vite-imagetools'
import { defineConfig } from 'vitest/config'
import remarkReadingTime from './plugins/remark-reading-time'
import { sitemapPlugin } from './sitemap-plugin'

const getBlogRoutes = (): Array<{ route: string; priority: number; changefreq: 'monthly' }> => {
  const currentDir = dirname(fileURLToPath(import.meta.url))
  const postsDir = join(currentDir, 'src/pages/Blog/posts')
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

export default defineConfig(({ isSsrBuild, mode }) => {
  const env = loadEnv(mode, dirname(fileURLToPath(import.meta.url)), '')
  return {
  plugins: [
    react(),
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
          }],
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
  }
})
