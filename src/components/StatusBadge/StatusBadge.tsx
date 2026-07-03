import type { CSSProperties, FC, ReactNode } from 'react'

import styles from './StatusBadge.module.css'

export interface StatusBadgeProps {
  /** @default 'neutral' */
  tone?: 'success' | 'warning' | 'error' | 'neutral'
  /** Show the leading dot. @default true */
  dot?: boolean
  children?: ReactNode
  className?: string
  style?: CSSProperties
}

const StatusBadge: FC<StatusBadgeProps> = ({
  tone = 'neutral',
  dot = true,
  children,
  className: extraClassName,
  style,
}) => {
  const className = [styles.badge, styles[tone], extraClassName].filter(Boolean).join(' ')

  return (
    <span className={className} style={style}>
      {dot && <span aria-hidden="true" className={styles.dot} />}
      {children}
    </span>
  )
}

export default StatusBadge
