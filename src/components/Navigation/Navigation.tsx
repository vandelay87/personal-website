import Link from '@components/Link'
import styles from './Navigation.module.css'

export default function Navigation() {
  return (
    <nav className={styles.nav} aria-label="Main navigation">
      <Link to="/">Home</Link>
      <Link to="/apps">Apps</Link>
      <Link to="/blog">Blog</Link>
    </nav>
  )
}
