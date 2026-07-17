import { AuthProvider } from '@contexts/AuthContext'
import { ToastProvider } from '@contexts/ToastContext'
import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'

export interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  /** Initial history entries for the MemoryRouter. Defaults to `['/']`. */
  initialEntries?: string[]
  /**
   * Wrap the tree in the real `AuthProvider` for components that read auth
   * state via `useAuth()` (e.g. admin-only UI). `AuthProvider` derives its
   * state from `@api/auth`'s `getCurrentSession()`, so mock that module to
   * control the resulting `isAuthenticated`/`isAdmin`/`user` values. Defaults
   * to `false` — most components don't need real auth wiring and can mock
   * `useAuth` directly instead.
   */
  withAuth?: boolean
}

export const renderWithProviders = (
  ui: ReactElement,
  { initialEntries = ['/'], withAuth = false, ...renderOptions }: RenderWithProvidersOptions = {}
) =>
  render(ui, {
    wrapper: ({ children }: { children: ReactNode }) => {
      const routed = (
        <MemoryRouter initialEntries={initialEntries}>
          <ToastProvider>{children}</ToastProvider>
        </MemoryRouter>
      )
      return withAuth ? <AuthProvider>{routed}</AuthProvider> : routed
    },
    ...renderOptions,
  })
