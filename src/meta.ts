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

export function getMetaTags(_path: string): MetaTags {
  return {
    title: '',
    description: '',
    canonical: '',
    og: {
      type: '',
      url: '',
      title: '',
      description: '',
    },
    twitter: {
      card: '',
      title: '',
      description: '',
    },
  }
}

export function normalisePath(_path: string): string {
  return _path
}

export function escapeHtml(_str: string): string {
  return _str
}
