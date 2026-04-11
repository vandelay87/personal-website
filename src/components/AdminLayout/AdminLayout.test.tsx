import AdminLayout from '@components/AdminLayout'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('@contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

import { useAuth } from '@contexts/AuthContext'

const mockUseAuth = vi.mocked(useAuth)

const renderWithRouter = (ui: React.ReactElement, { route = '/admin/recipes' } = {}) => {
  return render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>)
}

describe('AdminLayout', () => {
  const mockLogout = vi.fn()

  beforeEach(() => {
    mockLogout.mockReset()
    mockUseAuth.mockReturnValue({
      user: { email: 'admin@example.com', groups: ['admin'] },
      isAuthenticated: true,
      isAdmin: true,
      loading: false,
      login: vi.fn(),
      logout: mockLogout,
      getAccessToken: vi.fn(),
    })
  })

  it('renders top bar with user email and logout button', () => {
    renderWithRouter(
      <AdminLayout>
        <div>Content</div>
      </AdminLayout>
    )

    expect(screen.getByText('admin@example.com')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument()
  })

  it('sidebar shows "Recipes" and "Users" nav items', () => {
    renderWithRouter(
      <AdminLayout>
        <div>Content</div>
      </AdminLayout>
    )

    expect(screen.getByRole('link', { name: /recipes/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /users/i })).toBeInTheDocument()
  })

  it('active page has aria-current="page"', () => {
    renderWithRouter(
      <AdminLayout>
        <div>Content</div>
      </AdminLayout>,
      { route: '/admin/recipes' }
    )

    const recipesLink = screen.getByRole('link', { name: /recipes/i })

    expect(recipesLink).toHaveAttribute('aria-current', 'page')
  })

  it('clicking logout calls auth context logout', () => {
    renderWithRouter(
      <AdminLayout>
        <div>Content</div>
      </AdminLayout>
    )

    const logoutButton = screen.getByRole('button', { name: /logout/i })

    fireEvent.click(logoutButton)

    expect(mockLogout).toHaveBeenCalledTimes(1)
  })

  it('"Users" nav item is hidden for non-admin users', () => {
    mockUseAuth.mockReturnValue({
      user: { email: 'contributor@example.com', groups: ['contributor'] },
      isAuthenticated: true,
      isAdmin: false,
      loading: false,
      login: vi.fn(),
      logout: mockLogout,
      getAccessToken: vi.fn(),
    })

    renderWithRouter(
      <AdminLayout>
        <div>Content</div>
      </AdminLayout>
    )

    expect(screen.getByRole('link', { name: /recipes/i })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /users/i })).not.toBeInTheDocument()
  })
})
