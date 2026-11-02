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
  preloadImage?: Pick<PostHeroImage, 'src' | 'srcSet'> & { sizes: string }
}

import { matchRoutes, type RouteMatch } from 'react-router-dom'
import type { RecipeData } from './contexts/RecipeDataContext'
import * as postsModule from './pages/Blog/posts/index'
import { HERO_IMAGE_SIZES, type PostHeroImage, type PostMeta } from './pages/Blog/posts/index'
import { routes } from './routes'
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

const BLOG_POST_ROUTE = '/blog/:slug'
const RECIPE_ROUTE = '/recipes/:slug'

const matchLeafRoute = (path: string): RouteMatch | undefined => {
  const leaf = matchRoutes(routes, path)?.at(-1)
  return leaf?.route.path === '*' ? undefined : leaf
}

const getSlugForRoute = (path: string, routePath: string): string | undefined => {
  const leaf = matchLeafRoute(path)
  return leaf?.route.path === routePath ? leaf.params.slug : undefined
}

const getBlogPostForPath = (path: string): PostMeta | undefined => {
  const slug = getSlugForRoute(path, BLOG_POST_ROUTE)
  return slug ? postsModule.getPost(slug) : undefined
}

export const getRecipeSlugForPath = (path: string): string | undefined =>
  getSlugForRoute(path, RECIPE_ROUTE)

export const escapeHtml = (str: string): string => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export const isKnownRoute = (path: string): boolean => {
  const leaf = matchLeafRoute(path)
  if (!leaf) return false
  if (leaf.route.path !== BLOG_POST_ROUTE) return true
  return leaf.params.slug !== undefined && postsModule.getPost(leaf.params.slug) !== undefined
}

const buildMetaTags = (
  title: string,
  description: string,
  canonical: string,
  robots?: string,
  ogType: string = 'website',
  image?: string,
): MetaTags => {
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
      ...(image && { image }),
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(image && { image }),
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
        post.hero?.ogImage,
      ),
      ...(post.hero && {
        preloadImage: { src: post.hero.image.src, srcSet: post.hero.image.srcSet, sizes: HERO_IMAGE_SIZES },
      }),
    }
  }

  if (getRecipeSlugForPath(normalised) && data?.recipe) {
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
