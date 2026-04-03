import Navigation from '@components/Navigation'
import ThemeToggle from '@components/ThemeToggle'
import styles from './Header.module.css'

export default function Header() {
  return (
    <header className={styles.header}>
      <Navigation />
      <ThemeToggle />
    </header>
  )
}
