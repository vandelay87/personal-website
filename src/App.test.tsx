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

vi.mock('@pages/Login', () => ({
  default: () => <div>Login page</div>,
}))

vi.mock('@pages/AdminRecipeList', () => ({
  default: () => <div>Admin recipe list</div>,
}))

vi.mock('@pages/RecipeEditor', () => ({
  default: () => <div>Recipe editor</div>,
}))

vi.mock('@pages/RecipePreview', () => ({
  default: () => <div>Recipe preview</div>,
}))

vi.mock('@pages/UserManagement', () => ({
  default: () => <div>User management</div>,
}))

vi.mock('@contexts/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isAdmin: true,
    user: { email: 'admin@test.com', groups: ['admin'] },
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
    getAccessToken: vi.fn(),
  }),
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

  it('renders Login page at /admin/login', async () => {
    renderApp('/admin/login')
    expect(await screen.findByText('Login page')).toBeInTheDocument()
  })

  it('renders admin recipes at /admin/recipes', async () => {
    renderApp('/admin/recipes')
    expect(await screen.findByText('Admin recipe list')).toBeInTheDocument()
  })

  it('renders recipe editor at /admin/recipes/new', async () => {
    renderApp('/admin/recipes/new')
    expect(await screen.findByText('Recipe editor')).toBeInTheDocument()
  })

  it('renders recipe editor at /admin/recipes/:id/edit', async () => {
    renderApp('/admin/recipes/abc123/edit')
    expect(await screen.findByText('Recipe editor')).toBeInTheDocument()
  })

  it('renders recipe preview at /admin/recipes/:id/preview', async () => {
    renderApp('/admin/recipes/abc123/preview')
    expect(await screen.findByText('Recipe preview')).toBeInTheDocument()
  })

  it('renders user management at /admin/users', async () => {
    renderApp('/admin/users')
    expect(await screen.findByText('User management')).toBeInTheDocument()
  })
})
