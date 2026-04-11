import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@components/Header', () => ({
  default: () => <div data-testid="header-mock">Header</div>,
}))

vi.mock('@components/Layout', () => ({
  default: ({ children }: { children: import('react').ReactNode }) => <div>{children}</div>,
}))

vi.mock('@pages/Home', () => ({
  default: () => <div>Home page</div>,
}))

vi.mock('@pages/Apps', () => ({
  default: () => <div>Apps page</div>,
}))

vi.mock('@pages/Blog', () => ({
  default: () => <div>Blog page</div>,
}))

vi.mock('@pages/Blog/BlogPost', () => ({
  default: () => <div>Blog post page</div>,
}))

vi.mock('@pages/NotFound', () => ({
  default: () => <div>Not found page</div>,
}))

vi.mock('@pages/Recipes', () => ({
  default: () => <div>Recipes page</div>,
}))

vi.mock('@pages/RecipeDetail', () => ({
  default: () => <div>Recipe detail page</div>,
}))

import App from './App'

const renderApp = (route: string) =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <App />
    </MemoryRouter>
  )

describe('App routing', () => {
  it('renders Recipes page at /recipes', () => {
    renderApp('/recipes')
    expect(screen.getByText('Recipes page')).toBeInTheDocument()
  })

  it('renders RecipeDetail page at /recipes/:slug', () => {
    renderApp('/recipes/test-slug')
    expect(screen.getByText('Recipe detail page')).toBeInTheDocument()
  })
})
