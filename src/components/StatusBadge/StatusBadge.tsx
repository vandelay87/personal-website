import type { CSSProperties, FC, ReactNode } from 'react'

import styles from './StatusBadge.module.css'

export interface StatusBadgeProps {
  /** @default 'neutral' */
  tone?: 'success' | 'warning' | 'error' | 'neutral' | 'accent'
  /** Show the leading dot. @default true */
  dot?: boolean
  /** @default 'chip' */
  shape?: 'chip' | 'pill'
  children?: ReactNode
  className?: string
  style?: CSSProperties
}

const StatusBadge: FC<StatusBadgeProps> = ({
  tone = 'neutral',
  dot = true,
  shape = 'chip',
  children,
  className: extraClassName,
  style,
}) => {
  const className = [styles.badge, styles[tone], shape === 'pill' && styles.pill, extraClassName]
    .filter(Boolean)
    .join(' ')

  return (
    <span className={className} style={style}>
      {dot && <span aria-hidden="true" className={styles.dot} />}
      {children}
    </span>
  )
}

export default StatusBadge
