import { FC, ReactNode } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import styles from './Link.module.css'

interface LinkProps {
  children: ReactNode
  to: string
  underline?: boolean
  ariaLabel?: string
  className?: string
}

const Link: FC<LinkProps> = ({
  children,
  to,
  underline = false,
  ariaLabel,
  className: externalClassName,
}) => {
  const isExternal =
    /^https?:\/\//.test(to) || to.startsWith('mailto:') || to.startsWith('tel:')

  const className = [styles.link, underline ? styles.underline : '', externalClassName].filter(Boolean).join(' ')

  if (isExternal) {
    return (
      <a
        href={to}
        className={className}
        target="_blank"
        rel="noreferrer"
        aria-label={ariaLabel}
      >
        {children}
      </a>
    )
  }

  return (
    <RouterLink to={to} className={className} aria-label={ariaLabel}>
      {children}
    </RouterLink>
  )
}

export default Link
