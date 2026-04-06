import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import type { MDXComponents } from '*.mdx'

export interface PostMeta {
  title: string
  date: string
  description: string
  tags: string[]
  slug: string
  readingTime: number
  image?: string
}

interface MDXModule {
  default: ComponentType<{ components?: MDXComponents }>
}

interface Frontmatter {
  title: string
  date: string
  description: string
  tags: string[]
}

interface EagerMDXModule {
  frontmatter: Frontmatter
  readingTime: number
}

const eagerModules = import.meta.glob('./*.mdx', {
  eager: true,
}) as Record<string, EagerMDXModule>

const contentModules = import.meta.glob('./*.mdx') as Record<
  string,
  () => Promise<MDXModule>
>

const extractSlug = (path: string): string => {
  return path.replace('./', '').replace('.mdx', '')
}

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString + 'T00:00:00')
  return date.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export const posts: PostMeta[] = Object.entries(eagerModules)
  .map(([path, mod]) => ({
    ...mod.frontmatter,
    slug: extractSlug(path),
    readingTime: mod.readingTime ?? 1,
  }))
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

export const getPost = (slug: string): PostMeta | undefined => {
  return posts.find((post) => post.slug === slug)
}

export const loadPostContent = (
  slug: string
): (() => Promise<MDXModule>) | undefined => {
  const path = `./${slug}.mdx`
  return contentModules[path]
}

const lazyCache = new Map<
  string,
  LazyExoticComponent<ComponentType<{ components?: MDXComponents }>>
>()

export const getLazyPost = (
  slug: string
):
  | LazyExoticComponent<ComponentType<{ components?: MDXComponents }>>
  | undefined => {
  const loader = loadPostContent(slug)
  if (!loader) return undefined

  let cached = lazyCache.get(slug)
  if (!cached) {
    cached = lazy(() => loader())
    lazyCache.set(slug, cached)
  }
  return cached
}
