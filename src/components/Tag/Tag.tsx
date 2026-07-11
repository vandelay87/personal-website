import type { CSSProperties, FC, MouseEvent, ReactNode } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import styles from './Tag.module.css'

export interface TagProps {
  /** `span` for display, `button` for an interactive filter chip, `a` for a navigable link. @default 'span' */
  as?: 'span' | 'button' | 'a'
  /** Destination for `as="a"`; ignored otherwise. */
  to?: string
  /** Selected filter state (accent fill). @default false */
  active?: boolean
  /** Adds a remove control (editor tag input). @default false */
  removable?: boolean
  onRemove?: (e: MouseEvent) => void
  onClick?: (e: MouseEvent) => void
  children?: ReactNode
  className?: string
  style?: CSSProperties
}

const Tag: FC<TagProps> = ({
  as = 'span',
  to,
  active = false,
  removable = false,
  onRemove,
  onClick,
  children,
  className: extraClassName,
  style,
}) => {
  const className = [styles.tag, active && styles.active, extraClassName]
    .filter(Boolean)
    .join(' ')

  if (as === 'button') {
    return (
      <button
        type="button"
        className={className}
        style={style}
        aria-pressed={active}
        onClick={onClick}
      >
        {children}
      </button>
    )
  }

  if (as === 'a') {
    const href = to ?? ''
    const isExternal =
      /^https?:\/\//.test(href) || href.startsWith('mailto:') || href.startsWith('tel:')

    if (isExternal) {
      return (
        <a href={href} className={className} style={style} onClick={onClick}>
          {children}
        </a>
      )
    }

    return (
      <RouterLink to={href} className={className} style={style} onClick={onClick}>
        {children}
      </RouterLink>
    )
  }

  const removeLabel = typeof children === 'string' ? `Remove ${children}` : 'Remove tag'

  return (
    <span className={className} style={style}>
      {children}
      {removable && (
        <button type="button" className={styles.remove} aria-label={removeLabel} onClick={onRemove}>
          <span aria-hidden="true">&times;</span>
        </button>
      )}
    </span>
  )
}

export default Tag
