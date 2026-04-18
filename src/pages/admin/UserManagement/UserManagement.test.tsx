import { fetchUsers, inviteUser, removeUser, UserExistsError } from '@api/users'
import { useAuth } from '@contexts/AuthContext'
import type { AdminUser } from '@models/auth'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import UserManagement from './UserManagement'

vi.mock('@api/users', () => ({
  fetchUsers: vi.fn(),
  inviteUser: vi.fn(),
  removeUser: vi.fn(),
  UserExistsError: class UserExistsError extends Error {
    constructor(message = 'User already exists') {
      super(message)
      this.name = 'UserExistsError'
    }
  },
}))

vi.mock('@contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

const adminUser: AdminUser = {
  email: 'admin@akli.dev',
  userId: 'user-admin',
  role: 'admin',
  status: 'confirmed',
}

const contributorUser: AdminUser = {
  email: 'contrib@akli.dev',
  userId: 'user-contrib',
  role: 'contributor',
  status: 'confirmed',
}

const pendingUser: AdminUser = {
  email: 'pending@akli.dev',
  userId: 'user-pending',
  role: 'contributor',
  status: 'pending',
}

const renderUserManagement = () =>
  render(
    <MemoryRouter initialEntries={['/admin/users']}>
      <UserManagement />
    </MemoryRouter>
  )

describe('Admin UserManagement page', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(useAuth).mockReturnValue({
      getAccessToken: vi.fn().mockResolvedValue('token-123'),
      isAdmin: true,
      user: { email: 'admin@akli.dev', groups: ['admin'] },
      isAuthenticated: true,
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
    })
    vi.mocked(fetchUsers).mockResolvedValue([adminUser, contributorUser, pendingUser])
    vi.mocked(inviteUser).mockResolvedValue(undefined)
    vi.mocked(removeUser).mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('user table (AC2)', () => {
    it('renders a row for each user with email, role badge, and status', async () => {
      renderUserManagement()

      await waitFor(() => {
        expect(screen.getByText('admin@akli.dev')).toBeInTheDocument()
      })
      expect(screen.getByText('contrib@akli.dev')).toBeInTheDocument()
      expect(screen.getByText('pending@akli.dev')).toBeInTheDocument()

      // Role badges (at least one admin, two contributor)
      expect(screen.getAllByText(/admin/i).length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText(/contributor/i).length).toBeGreaterThanOrEqual(2)

      // Status values
      expect(screen.getAllByText(/confirmed/i).length).toBeGreaterThanOrEqual(2)
      expect(screen.getByText(/pending/i)).toBeInTheDocument()
    })

    it('calls fetchUsers with the current access token on mount', async () => {
      renderUserManagement()

      await waitFor(() => {
        expect(fetchUsers).toHaveBeenCalledWith('token-123')
      })
    })
  })

  describe('loading and error states (AC9)', () => {
    it('shows a loading indicator while fetching users', () => {
      vi.mocked(fetchUsers).mockReturnValue(new Promise(() => {}))
      renderUserManagement()

      expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument()
    })

    it('shows an error state with a retry button when fetchUsers rejects', async () => {
      vi.mocked(fetchUsers).mockRejectedValueOnce(new Error('500 Internal Server Error'))
      renderUserManagement()

      const retryButton = await screen.findByRole('button', { name: /retry/i })
      expect(retryButton).toBeInTheDocument()
    })

    it('re-fetches users when retry is clicked', async () => {
      vi.mocked(fetchUsers).mockRejectedValueOnce(new Error('500 Internal Server Error'))
      renderUserManagement()

      const retryButton = await screen.findByRole('button', { name: /retry/i })

      vi.mocked(fetchUsers).mockResolvedValueOnce([adminUser])
      fireEvent.click(retryButton)

      await waitFor(() => {
        expect(screen.getByText('admin@akli.dev')).toBeInTheDocument()
      })
    })
  })

  describe('invite flow (AC3, AC4, AC5, AC6)', () => {
    it('opens an invite form with email input and role select when the Invite button is clicked', async () => {
      const user = userEvent.setup()
      renderUserManagement()

      await waitFor(() => {
        expect(screen.getByText('admin@akli.dev')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /invite user/i }))

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/role/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /send invite/i })).toBeInTheDocument()
    })

    it('disables the submit button while the email is invalid', async () => {
      const user = userEvent.setup()
      renderUserManagement()

      await waitFor(() => {
        expect(screen.getByText('admin@akli.dev')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /invite user/i }))

      const submitButton = screen.getByRole('button', { name: /send invite/i })
      expect(submitButton).toBeDisabled()

      const emailInput = screen.getByLabelText(/email/i)
      await user.type(emailInput, 'not-an-email')
      expect(submitButton).toBeDisabled()

      await user.clear(emailInput)
      await user.type(emailInput, 'new@akli.dev')
      expect(submitButton).toBeEnabled()
    })

    it('submits the invite and shows a success toast with the invited email', async () => {
      const user = userEvent.setup()
      renderUserManagement()

      await waitFor(() => {
        expect(screen.getByText('admin@akli.dev')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /invite user/i }))

      await user.type(screen.getByLabelText(/email/i), 'new@akli.dev')
      await user.selectOptions(screen.getByLabelText(/role/i), 'contributor')
      await user.click(screen.getByRole('button', { name: /send invite/i }))

      await waitFor(() => {
        expect(inviteUser).toHaveBeenCalledWith('token-123', 'new@akli.dev', 'contributor')
      })

      const toast = await screen.findByRole('status')
      expect(toast).toHaveTextContent(/invite sent to new@akli\.dev/i)
    })

    it('shows an inline "User already exists" error when inviteUser rejects with UserExistsError', async () => {
      vi.mocked(inviteUser).mockRejectedValueOnce(new UserExistsError())

      const user = userEvent.setup()
      renderUserManagement()

      await waitFor(() => {
        expect(screen.getByText('admin@akli.dev')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /invite user/i }))
      await user.type(screen.getByLabelText(/email/i), 'contrib@akli.dev')
      await user.click(screen.getByRole('button', { name: /send invite/i }))

      expect(await screen.findByText(/user already exists/i)).toBeInTheDocument()
      // No success toast
      expect(screen.queryByText(/invite sent to/i)).not.toBeInTheDocument()
    })
  })

  describe('remove flow (AC7, AC8)', () => {
    it('does not render a remove button for the current user', async () => {
      renderUserManagement()

      await waitFor(() => {
        expect(screen.getByText('admin@akli.dev')).toBeInTheDocument()
      })

      const adminRow = screen.getByText('admin@akli.dev').closest('tr')
      expect(adminRow).not.toBeNull()

      const removeButton = within(adminRow as HTMLElement).queryByRole('button', {
        name: /remove/i,
      })
      expect(removeButton).toBeNull()
    })

    it('opens a confirmation dialog when remove is clicked for another user', async () => {
      const user = userEvent.setup()
      renderUserManagement()

      await waitFor(() => {
        expect(screen.getByText('contrib@akli.dev')).toBeInTheDocument()
      })

      const contribRow = screen.getByText('contrib@akli.dev').closest('tr')
      const removeButton = within(contribRow as HTMLElement).getByRole('button', {
        name: /remove/i,
      })

      await user.click(removeButton)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('calls removeUser after confirming and shows a success toast', async () => {
      const user = userEvent.setup()
      renderUserManagement()

      await waitFor(() => {
        expect(screen.getByText('contrib@akli.dev')).toBeInTheDocument()
      })

      const contribRow = screen.getByText('contrib@akli.dev').closest('tr')
      const removeButton = within(contribRow as HTMLElement).getByRole('button', {
        name: /remove/i,
      })
      await user.click(removeButton)

      const confirmButton = screen.getByRole('button', { name: /confirm/i })

      // After removal, fetchUsers should return the reduced list
      vi.mocked(fetchUsers).mockResolvedValueOnce([adminUser, pendingUser])

      await user.click(confirmButton)

      await waitFor(() => {
        expect(removeUser).toHaveBeenCalledWith('token-123', 'user-contrib')
      })

      // User disappears from the list
      await waitFor(() => {
        expect(screen.queryByText('contrib@akli.dev')).not.toBeInTheDocument()
      })

      // Success toast
      const toasts = await screen.findAllByRole('status')
      expect(toasts.some((t) => /removed|success/i.test(t.textContent ?? ''))).toBe(true)
    })
  })
})
