import { useEffect, useState } from 'react'
import styles from './ThemeToggle.module.css'

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const isDark = theme === 'dark'

  const trackClass = [styles.track, isDark ? styles.checked : '', focused ? styles.focused : '']
    .filter(Boolean)
    .join(' ')

  const thumbClass = [styles.thumb, isDark ? styles.checked : ''].filter(Boolean).join(' ')

  return (
    <div className={styles.wrapper}>
      <span id="theme-toggle-label" className={styles.label}>
        Dark Mode
      </span>

      <label htmlFor="theme-toggle" className={styles.toggleLabel}>
        <input
          id="theme-toggle"
          type="checkbox"
          className={styles.input}
          checked={isDark}
          onChange={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-labelledby="theme-toggle-label"
          aria-checked={isDark}
        />
        <div className={trackClass}>
          <div className={thumbClass} />
        </div>
      </label>
    </div>
  )
}
