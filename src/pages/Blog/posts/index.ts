import React, { type ComponentType } from 'react'
import type { MDXComponents } from '*.mdx'

export interface PostMeta {
  title: string
  date: string
  description: string
  tags: string[]
  slug: string
  readingTime: number
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

function extractSlug(path: string): string {
  return path.replace('./', '').replace('.mdx', '')
}

export const posts: PostMeta[] = Object.entries(eagerModules)
  .map(([path, mod]) => ({
    ...mod.frontmatter,
    slug: extractSlug(path),
    readingTime: mod.readingTime ?? 1,
  }))
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

export function getPost(slug: string): PostMeta | undefined {
  return posts.find((post) => post.slug === slug)
}

export function loadPostContent(
  slug: string
): (() => Promise<MDXModule>) | undefined {
  const path = `./${slug}.mdx`
  return contentModules[path]
}

const lazyCache = new Map<
  string,
  React.LazyExoticComponent<ComponentType<{ components?: MDXComponents }>>
>()

export function getLazyPost(
  slug: string
):
  | React.LazyExoticComponent<ComponentType<{ components?: MDXComponents }>>
  | undefined {
  const loader = loadPostContent(slug)
  if (!loader) return undefined

  let cached = lazyCache.get(slug)
  if (!cached) {
    cached = React.lazy(() => loader())
    lazyCache.set(slug, cached)
  }
  return cached
}
