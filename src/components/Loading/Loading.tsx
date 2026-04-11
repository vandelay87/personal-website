import type { FC } from 'react'
import styles from './Loading.module.css'

export interface LoadingProps {
  size?: 'default' | 'small'
}

const Loading: FC<LoadingProps> = ({ size = 'default' }) => {
  const className = size === 'small'
    ? `${styles.spinner} ${styles.small}`
    : styles.spinner

  return (
    <span
      role="status"
      aria-live="polite"
      aria-label="Loading content"
      className={className}
    />
  )
}

export default Loading
