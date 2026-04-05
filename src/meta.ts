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
  }
  twitter: {
    card: string
    title: string
    description: string
  }
}

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
}

const notFoundMeta = {
  title: 'Page Not Found | Akli Aissat',
  description: 'The page you are looking for does not exist.',
}

export function normalisePath(path: string): string {
  if (path === '/') return '/'
  return path.endsWith('/') ? path.slice(0, -1) : path
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export const KNOWN_ROUTES = new Set(Object.keys(routeMeta))

function buildMetaTags(
  title: string,
  description: string,
  canonical: string,
  robots?: string,
): MetaTags {
  return {
    title,
    description,
    canonical,
    ...(robots && { robots }),
    og: {
      type: 'website',
      url: canonical,
      title,
      description,
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  }
}

export function getMetaTags(path: string): MetaTags {
  const normalised = normalisePath(path)
  const route = routeMeta[normalised]
  const canonical = `${BASE_URL}${normalised}`

  if (route) {
    return buildMetaTags(route.title, route.description, canonical)
  }

  return buildMetaTags(notFoundMeta.title, notFoundMeta.description, canonical, 'noindex')
}
