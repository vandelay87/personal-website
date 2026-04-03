import { ReactNode } from 'react'
import styles from './Layout.module.css'

type LayoutProps = {
  children: ReactNode
  isHomePage?: boolean
}

export default function Layout({ children, isHomePage = false }: LayoutProps) {
  return (
    <main className={`${styles.main}${!isHomePage ? ` ${styles.withHeader}` : ''}`}>
      {children}
    </main>
  )
}
