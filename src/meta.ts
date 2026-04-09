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
}

import * as postsModule from './pages/Blog/posts/index'

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
  const blogPostMatch = path.match(/^\/blog\/(.+)$/)
  if (blogPostMatch) {
    const post = postsModule.getPost(blogPostMatch[1])
    return !!post
  }
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
  const fullImage = image ? `${BASE_URL}${image}` : undefined
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

export const getMetaTags = (path: string): MetaTags => {
  const normalised = normalisePath(path)
  const route = routeMeta[normalised]
  const canonical = `${BASE_URL}${normalised}`

  if (route) {
    return buildMetaTags(route.title, route.description, canonical)
  }

  const blogPostMatch = normalised.match(/^\/blog\/(.+)$/)
  if (blogPostMatch) {
    const slug = blogPostMatch[1]
    const post = postsModule.getPost(slug)
    if (post) {
      return buildMetaTags(
        `${post.title} | Akli Aissat`,
        post.description,
        canonical,
        undefined,
        'article',
        post.image,
      )
    }
  }

  return buildMetaTags(notFoundMeta.title, notFoundMeta.description, canonical, 'noindex')
}
