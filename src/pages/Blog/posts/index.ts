import type { ComponentType } from 'react'
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

const frontmatterModules = import.meta.glob('./*.mdx', {
  eager: true,
  import: 'frontmatter',
}) as Record<string, Frontmatter>

const readingTimeModules = import.meta.glob('./*.mdx', {
  eager: true,
  import: 'readingTime',
}) as Record<string, number>

const contentModules = import.meta.glob('./*.mdx') as Record<
  string,
  () => Promise<MDXModule>
>

function extractSlug(path: string): string {
  return path.replace('./', '').replace('.mdx', '')
}

export const posts: PostMeta[] = Object.entries(frontmatterModules)
  .map(([path, frontmatter]) => ({
    ...frontmatter,
    slug: extractSlug(path),
    readingTime: readingTimeModules[path] ?? 1,
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
