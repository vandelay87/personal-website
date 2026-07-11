import { render, screen, fireEvent } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, afterEach } from 'vitest'
import Header from './Header'

const renderWithRouter = (ui: ReactElement, { route = '/' } = {}) => {
  return render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>)
}

const LINKS = [
  { label: 'Recipes', to: '/admin/recipes' },
  { label: 'Users', to: '/admin/users' },
]

describe('Header', () => {
  it('renders a banner landmark', () => {
    renderWithRouter(<Header />)
    expect(screen.getByRole('banner')).toBeInTheDocument()
  })

  it('renders the brand link pointing to brandTo', () => {
    renderWithRouter(<Header brand="akli.dev" brandTo="/admin" />)
    expect(screen.getByRole('link', { name: 'akli.dev' })).toHaveAttribute('href', '/admin')
  })

  it('renders the ThemeToggle in every variant', () => {
    const variants = ['public', 'admin', 'logged-out'] as const
    variants.forEach((variant) => {
      const { unmount } = renderWithRouter(<Header variant={variant} />)
      expect(screen.getByRole('button', { name: /switch to (dark|light) mode/i })).toBeInTheDocument()
      unmount()
    })
  })

  describe('public variant', () => {
    it('renders nav links and marks the active route with aria-current', () => {
      renderWithRouter(<Header variant="public" links={LINKS} />, { route: '/admin/recipes' })

      const recipesLink = screen.getByRole('link', { name: 'Recipes' })
      const usersLink = screen.getByRole('link', { name: 'Users' })

      expect(recipesLink).toHaveAttribute('aria-current', 'page')
      expect(usersLink).not.toHaveAttribute('aria-current')
    })

    it('renders no logout button or email', () => {
      renderWithRouter(<Header variant="public" links={LINKS} />)
      expect(screen.queryByRole('button', { name: /log out/i })).not.toBeInTheDocument()
    })
  })

  describe('admin variant', () => {
    it('renders the signed-in email and a working Log out button', () => {
      const onLogout = vi.fn()
      renderWithRouter(
        <Header variant="admin" links={LINKS} email="admin@example.com" onLogout={onLogout} />,
        { route: '/admin/recipes' }
      )

      expect(screen.getByText('admin@example.com')).toBeInTheDocument()

      const logoutButton = screen.getByRole('button', { name: /log out/i })
      fireEvent.click(logoutButton)

      expect(onLogout).toHaveBeenCalledTimes(1)
    })

    it('marks the active route with aria-current', () => {
      renderWithRouter(<Header variant="admin" links={LINKS} />, { route: '/admin/users' })

      expect(screen.getByRole('link', { name: 'Users' })).toHaveAttribute('aria-current', 'page')
      expect(screen.getByRole('link', { name: 'Recipes' })).not.toHaveAttribute('aria-current')
    })
  })

  describe('logged-out variant', () => {
    it('renders no nav links and no logout button', () => {
      renderWithRouter(
        <Header variant="logged-out" links={LINKS} email="admin@example.com" onLogout={vi.fn()} />
      )

      expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
      expect(screen.queryByRole('link', { name: 'Recipes' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /log out/i })).not.toBeInTheDocument()
    })
  })

  describe('--header-height custom property', () => {
    afterEach(() => {
      document.documentElement.style.removeProperty('--header-height')
    })

    it('sets --header-height on the document root after mount', () => {
      renderWithRouter(<Header />)

      const headerHeight = document.documentElement.style.getPropertyValue('--header-height')

      expect(headerHeight).not.toBe('')
      expect(headerHeight).toMatch(/^\d+(\.\d+)?px$/)
    })
  })
})
