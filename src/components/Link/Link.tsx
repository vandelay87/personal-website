import { FC, ReactNode } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import styles from './Link.module.css'

export interface LinkProps {
  children: ReactNode
  to: string
  underline?: boolean
  /** @default 'inherit' */
  tone?: 'inherit' | 'muted' | 'accent'
  /** Optional icon (chevron/arrow) that animates on hover. */
  icon?: ReactNode
  /** @default 'right' */
  iconSide?: 'left' | 'right'
  /** Direction the icon nudges on hover. @default 'right' */
  nudge?: 'left' | 'right' | 'up-right' | 'none'
  ariaLabel?: string
  className?: string
}

const NUDGE_CLASSES: Record<NonNullable<LinkProps['nudge']>, string | undefined> = {
  left: styles.nudgeLeft,
  right: styles.nudgeRight,
  'up-right': styles.nudgeUpRight,
  none: undefined,
}

const Link: FC<LinkProps> = ({
  children,
  to,
  underline = false,
  tone = 'inherit',
  icon,
  iconSide = 'right',
  nudge = 'right',
  ariaLabel,
  className: externalClassName,
}) => {
  const isExternal =
    /^https?:\/\//.test(to) || to.startsWith('mailto:') || to.startsWith('tel:')

  const className = [
    styles.link,
    styles[tone],
    underline ? styles.underline : '',
    externalClassName,
  ]
    .filter(Boolean)
    .join(' ')

  const iconClassName = [styles.icon, NUDGE_CLASSES[nudge]].filter(Boolean).join(' ')

  const content = icon ? (
    <>
      {iconSide === 'left' && (
        <span className={iconClassName} aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
      {iconSide === 'right' && (
        <span className={iconClassName} aria-hidden="true">
          {icon}
        </span>
      )}
    </>
  ) : (
    children
  )

  if (isExternal) {
    return (
      <a
        href={to}
        className={className}
        target="_blank"
        rel="noreferrer"
        aria-label={ariaLabel}
      >
        {content}
      </a>
    )
  }

  return (
    <RouterLink to={to} className={className} aria-label={ariaLabel}>
      {content}
    </RouterLink>
  )
}

export default Link
