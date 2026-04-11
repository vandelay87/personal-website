
import Button from '@components/Button'
import Typography from '@components/Typography'
import { useAuth } from '@contexts/AuthContext'
import type { FC, ReactNode } from 'react'
import { Link as RouterLink, useLocation } from 'react-router-dom'

import styles from './AdminLayout.module.css'

export interface AdminLayoutProps {
  children: ReactNode
}

const AdminLayout: FC<AdminLayoutProps> = ({ children }) => {
  const { user, isAdmin, logout } = useAuth()
  const location = useLocation()

  const isActive = (path: string) => location.pathname.startsWith(path)

  return (
    <div className={styles.layout}>
      <header className={styles.topBar}>
        <RouterLink to="/" className={styles.siteName}>
          <Typography variant="heading4" as="span">
            akli.dev
          </Typography>
        </RouterLink>
        <div className={styles.userSection}>
          <Typography variant="body" as="span">
            {user?.email}
          </Typography>
          <Button onClick={logout} variant="secondary" ariaLabel="Logout">
            Logout
          </Button>
        </div>
      </header>

      <div className={styles.body}>
        <nav className={styles.sidebar}>
          <RouterLink
            to="/admin/recipes"
            className={styles.navLink}
            aria-current={isActive('/admin/recipes') ? 'page' : undefined}
          >
            Recipes
          </RouterLink>
          {isAdmin && (
            <RouterLink
              to="/admin/users"
              className={styles.navLink}
              aria-current={isActive('/admin/users') ? 'page' : undefined}
            >
              Users
            </RouterLink>
          )}
        </nav>

        <main className={styles.content}>{children}</main>
      </div>
    </div>
  )
}

export default AdminLayout
