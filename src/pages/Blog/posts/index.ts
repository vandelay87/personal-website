import type { ImageProps } from '@akli-dev/ui'
import { blogImageSources, blogImageUrl } from '@models/image'
import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import { frontmatterMap, readingTimeMap } from 'virtual:blog-posts-meta'
import type { MDXComponents } from '*.mdx'

export type PostHeroImage = Required<Pick<ImageProps, 'src' | 'srcSet' | 'alt'>> &
  Pick<ImageProps, 'caption'>

export interface PostHero {
  image: PostHeroImage
  ogImage: string
}

export const HERO_IMAGE_SIZES = '(max-width: 728px) calc(100vw - 98px), 630px'

export type PostHeroFrontmatter = Pick<PostHeroImage, 'alt' | 'caption'> & { stem: string }

export type PostFrontmatter = {
  title: string
  date: string
  description: string
  tags: string[]
  hero?: PostHeroFrontmatter
}

export interface PostMeta extends Omit<PostFrontmatter, 'hero'> {
  slug: string
  readingTime: number
  hero?: PostHero
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

const resolveHero = (slug: string, { stem, ...rest }: PostHeroFrontmatter): PostHero => ({
  image: { ...blogImageSources(slug, stem), ...rest },
  ogImage: blogImageUrl(slug, stem, 'full'),
})

export const posts: PostMeta[] = Object.entries(frontmatterMap)
  .map(([path, { hero, ...frontmatter }]) => {
    const slug = extractSlug(path)
    return {
      ...frontmatter,
      ...(hero && { hero: resolveHero(slug, hero) }),
      slug,
      readingTime: readingTimeMap[path] ?? 1,
    }
  })
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
