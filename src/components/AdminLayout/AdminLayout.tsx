import Footer from '@components/Footer'
import Header, { type HeaderLink } from '@components/Header'
import PageShell from '@components/PageShell'
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
      <PageShell
        header={<Header variant="admin" links={links} email={user?.email} onLogout={logout} />}
        footer={<Footer variant="admin" email={user?.email} />}
        mainClassName={styles.content}
      >
        {children}
      </PageShell>
    </div>
  )
}

export default AdminLayout
