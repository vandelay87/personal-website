import Header from '@components/Header'
import Layout from '@components/Layout'
import Loading from '@components/Loading'
import ScrollToTop from '@components/ScrollToTop'
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

export const RootLayout = () => (
  <>
    <Header />
    <ScrollToTop />
    <Layout>
      <Outlet />
    </Layout>
  </>
)
