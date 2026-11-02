export interface MetaTags {
  title: string
  description: string
  canonical: string
  robots?: string
  og: {
    type: string
    url: string
    title: string
    description: string
    image?: string
  }
  twitter: {
    card: string
    title: string
    description: string
    image?: string
  }
  preloadImage?: Pick<PostHero, 'src' | 'srcSet'> & { sizes: string }
}

import type { RecipeData } from './contexts/RecipeDataContext'
import * as postsModule from './pages/Blog/posts/index'
import { HERO_IMAGE_SIZES, type PostHero, type PostMeta } from './pages/Blog/posts/index'
import { recipeImageUrl } from './types/recipe'

const BASE_URL = 'https://akli.dev'

const routeMeta: Record<string, { title: string; description: string }> = {
  '/': {
    title: 'Akli Aissat — Full-Stack Engineer',
    description:
      'Full-stack engineer building responsive web applications with React, TypeScript, and modern web technologies. Explore my projects and experiments.',
  },
  '/apps': {
    title: 'Apps & Experiments | Akli Aissat',
    description:
      'Interactive side projects and experiments built to explore ideas and learn how things work.',
  },
  '/blog': {
    title: 'Blog | Akli Aissat',
    description:
      'Articles on web development, engineering, and lessons learned building software.',
  },
  '/recipes': {
    title: 'Recipes | Akli Aissat',
    description: 'Browse recipes for delicious home-cooked meals.',
  },
}

const notFoundMeta = {
  title: 'Page Not Found | Akli Aissat',
  description: 'The page you are looking for does not exist.',
}

export const normalisePath = (path: string): string => {
  if (path === '/') return '/'
  return path.endsWith('/') ? path.slice(0, -1) : path
}

const getBlogPostForPath = (path: string): PostMeta | undefined => {
  const blogPostMatch = path.match(/^\/blog\/(.+)$/)
  return blogPostMatch ? postsModule.getPost(blogPostMatch[1]) : undefined
}

export const escapeHtml = (str: string): string => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export const KNOWN_ROUTES = new Set(Object.keys(routeMeta))

export const isKnownRoute = (path: string): boolean => {
  if (KNOWN_ROUTES.has(path)) return true
  if (path.startsWith('/admin')) return true
  if (getBlogPostForPath(path)) return true
  const recipeMatch = path.match(/^\/recipes\/(.+)$/)
  if (recipeMatch) return true
  return false
}

const buildMetaTags = (
  title: string,
  description: string,
  canonical: string,
  robots?: string,
  ogType: string = 'website',
  image?: string,
): MetaTags => {
  const fullImage = image
    ? (image.startsWith('http') ? image : `${BASE_URL}${image}`)
    : undefined
  return {
    title,
    description,
    canonical,
    ...(robots && { robots }),
    og: {
      type: ogType,
      url: canonical,
      title,
      description,
      ...(fullImage && { image: fullImage }),
    },
    twitter: {
      card: fullImage ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(fullImage && { image: fullImage }),
    },
  }
}

export const getMetaTags = (path: string, data?: RecipeData): MetaTags => {
  const normalised = normalisePath(path)
  const route = routeMeta[normalised]
  const canonical = `${BASE_URL}${normalised}`

  if (route) {
    return buildMetaTags(route.title, route.description, canonical)
  }

  const post = getBlogPostForPath(normalised)
  if (post) {
    return {
      ...buildMetaTags(
        `${post.title} | Akli Aissat`,
        post.description,
        canonical,
        undefined,
        'article',
        post.image,
      ),
      ...(post.hero && {
        preloadImage: { src: post.hero.src, srcSet: post.hero.srcSet, sizes: HERO_IMAGE_SIZES },
      }),
    }
  }

  const recipeMatch = normalised.match(/^\/recipes\/(.+)$/)
  if (recipeMatch && data?.recipe) {
    const recipe = data.recipe
    const description = recipe.intro.length > 160
      ? recipe.intro.slice(0, 157) + '...'
      : recipe.intro
    return buildMetaTags(
      `${recipe.title} | Akli Aissat`,
      description,
      canonical,
      undefined,
      'article',
      recipeImageUrl(recipe.slug, 'cover', 'medium'),
    )
  }

  return buildMetaTags(notFoundMeta.title, notFoundMeta.description, canonical, 'noindex')
}
