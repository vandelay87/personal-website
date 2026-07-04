import AdminLayout from '@components/AdminLayout'
import Footer from '@components/Footer'
import Header, { type HeaderLink } from '@components/Header'
import Layout from '@components/Layout'
import Loading from '@components/Loading'
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
  <>
    <SkipLink />
    <Header variant="public" links={PUBLIC_LINKS} />
    <ScrollToTop />
    <Layout>
      <Outlet />
    </Layout>
    <Footer variant="public" />
  </>
)

/**
 * Login sits outside the admin shell (its own "logged-out" header — brand +
 * "Admin" label + ThemeToggle, no nav/logout) but still uses the public
 * Footer, since no design counterpart specifies an admin-styled one for it.
 */
export const LoginLayout = () => (
  <>
    <SkipLink />
    <Header variant="logged-out" />
    <ScrollToTop />
    <Layout>
      <Outlet />
    </Layout>
    <Footer variant="public" />
  </>
)

/** Admin site shell: AdminLayout composes the admin Header/Footer + skip link. */
export const AdminRootLayout = () => (
  <AdminLayout>
    <ScrollToTop />
    <Outlet />
  </AdminLayout>
)
