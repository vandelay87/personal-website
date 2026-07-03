import { useState } from 'react'
import styles from './ThemeToggle.module.css'

type Theme = 'light' | 'dark'

const getInitialTheme = (): Theme => {
  if (typeof document === 'undefined') return 'light'

  const domTheme = document.documentElement.getAttribute('data-theme')
  if (domTheme === 'light' || domTheme === 'dark') return domTheme

  const storedTheme = typeof window !== 'undefined' ? localStorage.getItem('theme') : null
  return storedTheme === 'dark' ? 'dark' : 'light'
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

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
