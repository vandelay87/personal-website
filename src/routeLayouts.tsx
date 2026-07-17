import AdminLayout from '@components/AdminLayout'
import Footer from '@components/Footer'
import Header, { type HeaderLink } from '@components/Header'
import Loading from '@components/Loading'
import PageShell from '@components/PageShell'
import ScrollToTop from '@components/ScrollToTop'
import SkipLink from '@components/SkipLink'
import { Suspense, type ReactNode } from 'react'
import { Outlet } from 'react-router-dom'

export const AdminSuspense = ({ children }: { children: ReactNode }) => (
  <Suspense
    fallback={
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12) 0' }}>
        <Loading />
      </div>
    }
  >
    {children}
  </Suspense>
)

const PUBLIC_LINKS: HeaderLink[] = [
  { label: 'Apps', to: '/apps' },
  { label: 'Recipes', to: '/recipes' },
  { label: 'Blog', to: '/blog' },
]

/** Public site shell: Home/Apps/Blog/Recipes/etc. */
export const RootLayout = () => (
  <PageShell header={<Header variant="public" links={PUBLIC_LINKS} />} footer={<Footer variant="public" />}>
    <ScrollToTop />
    <Outlet />
  </PageShell>
)

/**
 * Login sits outside the admin shell (its own "logged-out" header — brand +
 * "Admin" label + ThemeToggle, no nav/logout) but the PRD groups Login under
 * the admin-shell Footer too, so no `email` (no authenticated user yet).
 */
export const LoginLayout = () => (
  <PageShell header={<Header variant="logged-out" />} footer={<Footer variant="admin" />}>
    <ScrollToTop />
    <Outlet />
  </PageShell>
)

/** Admin site shell: AdminLayout composes the admin Header/Footer + skip link. */
export const AdminRootLayout = () => (
  <AdminLayout>
    <ScrollToTop />
    <Outlet />
  </AdminLayout>
)

/**
 * Recipe Preview sits outside the admin shell entirely — no admin Header nav
 * chrome (see Admin Recipe Preview.dc.html: no persistent app header, just
 * its own sticky status banner pinned at the true viewport top). The page
 * should read like the public Recipe page an actual visitor sees, with only
 * an admin-only status banner overlaid, so it gets the public Footer too
 * (the design's own footer at the bottom is the public "Elsewhere" nav, not
 * "Signed in as {{email}}").
 */
export const RecipePreviewLayout = () => (
  <>
    <SkipLink />
    <ScrollToTop />
    <Outlet />
    <Footer variant="public" />
  </>
)
