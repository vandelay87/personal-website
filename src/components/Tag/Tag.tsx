import type { CSSProperties, FC, MouseEvent, ReactNode } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import styles from './Tag.module.css'

interface TagBaseProps {
  /** Selected filter state (accent fill). @default false */
  active?: boolean
  /** Adds a remove control (editor tag input). @default false */
  removable?: boolean
  onRemove?: (e: MouseEvent) => void
  /** Extra className merged onto the remove button — only meaningful with `removable`. */
  removeClassName?: string
  onClick?: (e: MouseEvent) => void
  children?: ReactNode
  className?: string
  style?: CSSProperties
}

export type TagProps = TagBaseProps &
  (
    | {
        /** `a` for a navigable link. */
        as: 'a'
        /** Destination for `as="a"`; required. */
        to: string
      }
    | {
        /** `span` for display, `button` for an interactive filter chip. @default 'span' */
        as?: 'span' | 'button'
        to?: never
      }
  )

const Tag: FC<TagProps> = (props) => {
  const {
    active = false,
    removable = false,
    onRemove,
    onClick,
    children,
    className: extraClassName,
    removeClassName,
    style,
  } = props

  const className = [styles.tag, active && styles.active, extraClassName]
    .filter(Boolean)
    .join(' ')

  if (props.as === 'button') {
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

  if (props.as === 'a') {
    const href = props.to
    const isExternal =
      /^https?:\/\//.test(href) || href.startsWith('mailto:') || href.startsWith('tel:')

    if (isExternal) {
      return (
        <a
          href={href}
          className={className}
          style={style}
          onClick={onClick}
          target="_blank"
          rel="noreferrer"
        >
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

  const removeButtonClassName = [styles.remove, removeClassName].filter(Boolean).join(' ')
  const removeLabel = typeof children === 'string' ? `Remove ${children}` : 'Remove tag'

  return (
    <span className={className} style={style}>
      {children}
      {removable && (
        <button type="button" className={removeButtonClassName} aria-label={removeLabel} onClick={onRemove}>
          <span aria-hidden="true">&times;</span>
        </button>
      )}
    </span>
  )
}

export default Tag
