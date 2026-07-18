import { useLayoutEffect, useState } from 'react'
import styles from './ThemeToggle.module.css'

type Theme = 'light' | 'dark'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light')

  useLayoutEffect(() => {
    // Can't read this via a lazy useState initializer instead: the server
    // always renders 'light' (no `document`), and an inline bootstrap
    // script sets data-theme on <html> before hydration to avoid a flash
    // of the wrong theme. Reading it during the client's hydration render
    // would mismatch the server-rendered markup — this has to correct the
    // mirror after hydration completes, not during it.
    const domTheme = document.documentElement.getAttribute('data-theme')
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (domTheme === 'dark') setTheme('dark')
  }, [])

  const isDark = theme === 'dark'

  const handleClick = () => {
    const nextTheme: Theme = isDark ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', nextTheme)
    localStorage.setItem('theme', nextTheme)
    setTheme(nextTheme)
  }

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={handleClick}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span aria-hidden="true">{isDark ? '☀' : '☾'}</span>
    </button>
  )
}
