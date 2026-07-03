import type { CSSProperties, FC, MouseEvent, ReactNode } from 'react'
import styles from './Tag.module.css'

export interface TagProps {
  /** `span` for display, `button` for an interactive filter chip. @default 'span' */
  as?: 'span' | 'button'
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
