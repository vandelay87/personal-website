import { ReactNode } from 'react'
import styles from './Layout.module.css'

export default function Layout({ children }: { children: ReactNode }) {
  return <main className={styles.main}>{children}</main>
}
