import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import { frontmatterMap, readingTimeMap } from 'virtual:blog-posts-meta'
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

export const posts: PostMeta[] = Object.entries(frontmatterMap)
  .map(([path, frontmatter]) => ({
    ...frontmatter,
    slug: extractSlug(path),
    readingTime: readingTimeMap[path] ?? 1,
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

// The set of post slugs is fixed at build time (import.meta.glob above), so
// every lazy component can be built once here rather than on first access —
// getLazyPost becomes a plain lookup, never creating one at call time.
export const lazyPosts: Record<
  string,
  LazyExoticComponent<ComponentType<{ components?: MDXComponents }>>
> = Object.fromEntries(
  Object.keys(contentModules).map((path) => [
    extractSlug(path),
    lazy(() => contentModules[path]()),
  ])
)
