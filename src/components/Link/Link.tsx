import { FC, ReactNode } from 'react'
import { Link as RouterLink } from 'react-router-dom'

interface LinkProps {
  children: ReactNode
  to: string
  underline?: boolean
  ariaLabel?: string
}

const Link: FC<LinkProps> = ({
  children,
  to,
  underline = false,
  ariaLabel,
}) => {
  const isExternal =
    /^https?:\/\//.test(to) || to.startsWith('mailto:') || to.startsWith('tel:')
  const baseStyles = `text-blue-500 hover:text-blue-600 dark:text-blue-300 dark:hover:text-blue-200 transition-colors duration-200 ${
    underline ? 'underline underline-offset-4' : 'no-underline hover:underline'
  }`

  if (isExternal) {
    return (
      <a
        href={to}
        className={baseStyles}
        target="_blank"
        rel="noreferrer"
        aria-label={ariaLabel}
      >
        {children}
      </a>
    )
  }

  return (
    <RouterLink to={to} className={baseStyles} aria-label={ariaLabel}>
      {children}
    </RouterLink>
  )
}

export default Link
