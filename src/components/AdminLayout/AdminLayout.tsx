import Footer from '@components/Footer'
import Header, { type HeaderLink } from '@components/Header'
import SkipLink from '@components/SkipLink'
import { useAuth } from '@contexts/AuthContext'
import type { FC, ReactNode } from 'react'

import styles from './AdminLayout.module.css'

export interface AdminLayoutProps {
  children: ReactNode
}

const ADMIN_LINKS: HeaderLink[] = [
  { label: 'Recipes', to: '/admin/recipes' },
  { label: 'Users', to: '/admin/users' },
]

const ADMIN_LINKS_RECIPES_ONLY: HeaderLink[] = [{ label: 'Recipes', to: '/admin/recipes' }]

const AdminLayout: FC<AdminLayoutProps> = ({ children }) => {
  const { user, isAdmin, logout } = useAuth()

  const links = isAdmin ? ADMIN_LINKS : ADMIN_LINKS_RECIPES_ONLY

  return (
    <div className={styles.layout}>
      <SkipLink />
      <Header variant="admin" links={links} email={user?.email} onLogout={logout} />
      <main id="main" tabIndex={-1} className={styles.content}>
        {children}
      </main>
      <Footer variant="admin" email={user?.email} />
    </div>
  )
}

export default AdminLayout
