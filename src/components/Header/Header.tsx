import Button from '@components/Button'
import ThemeToggle from '@components/ThemeToggle'
import type { FC } from 'react'
import { useEffect, useRef } from 'react'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import styles from './Header.module.css'

export interface HeaderLink {
  label: string
  to: string
}

export type HeaderVariant = 'public' | 'admin' | 'logged-out'

export interface HeaderProps {
  /** @default 'public' */
  variant?: HeaderVariant
  /** Wordmark text. @default 'Akli Aissat' */
  brand?: string
  brandTo?: string
  /** Nav links; the current page is derived from the URL, not a per-link flag. */
  links?: HeaderLink[]
  /** Admin: signed-in email shown at right. */
  email?: string
  /** Admin: renders the "Log out" button when set. */
  onLogout?: () => void
  className?: string
}

const isLinkActive = (pathname: string, to: string) =>
  to === '/' ? pathname === '/' : pathname === to || pathname.startsWith(`${to}/`)

const Header: FC<HeaderProps> = ({
  variant = 'public',
  brand = 'Akli Aissat',
  brandTo = '/',
  links = [],
  email,
  onLogout,
  className: extraClassName,
}) => {
  const { pathname } = useLocation()
  const headerRef = useRef<HTMLElement>(null)
  const lastHeightRef = useRef<number | null>(null)

  useEffect(() => {
    const element = headerRef.current
    if (!element) return

    // entry.borderBoxSize, not getBoundingClientRect() — borderBoxSize is by
    // definition the content+padding+border box, so it already includes the
    // header's border-block-end without forcing a synchronous layout read on
    // every firing (getBoundingClientRect() falls back for the handful of
    // older engines that don't support borderBoxSize). Also re-fires on wrap
    // (single row -> two rows on narrow viewports), so --header-height stays
    // accurate for consumers like PageShell/AdminLayout's
    // scroll-margin-block-start without them needing wrap-aware media
    // queries. The rounded height is cached so sub-pixel jitter mid-resize
    // doesn't trigger redundant writes — every setProperty ripples a
    // style/layout recalc out to those consumers, not just the header.
    const observer = new ResizeObserver((entries) => {
      const [entry] = entries
      const height = entry.borderBoxSize?.[0]?.blockSize ?? entry.target.getBoundingClientRect().height
      const roundedHeight = Math.round(height)

      if (roundedHeight === lastHeightRef.current) return

      lastHeightRef.current = roundedHeight
      document.documentElement.style.setProperty('--header-height', `${roundedHeight}px`)
    })
    observer.observe(element)

    return () => observer.disconnect()
  }, [])

  const className = [
    styles.header,
    styles.sticky,
    variant === 'admin' && styles.admin,
    extraClassName,
  ]
    .filter(Boolean)
    .join(' ')

  const navLabel = variant === 'admin' ? 'Admin navigation' : 'Main navigation'

  const nav = links.length > 0 && (
    <nav aria-label={navLabel} className={styles.nav}>
      {links.map((link) => (
        <RouterLink
          key={link.to}
          to={link.to}
          className={styles.navLink}
          aria-current={isLinkActive(pathname, link.to) ? 'page' : undefined}
        >
          {link.label}
        </RouterLink>
      ))}
    </nav>
  )

  return (
    <header ref={headerRef} className={className}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <RouterLink to={brandTo} className={styles.brand}>
            {brand}
          </RouterLink>

          {variant === 'admin' && nav}
        </div>

        <div className={styles.actions}>
          {variant === 'public' && nav}

          {variant === 'logged-out' && <span className={styles.loggedOutLabel}>Admin</span>}

          {variant === 'admin' && (
            <>
              {email && <span className={styles.email}>{email}</span>}
              {onLogout && (
                <Button onClick={onLogout} variant="outline" size="sm">
                  Log out
                </Button>
              )}
            </>
          )}

          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}

export default Header
