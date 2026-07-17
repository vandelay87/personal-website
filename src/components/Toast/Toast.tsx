import { ListItem } from '@components/List'
import type { FC, ReactNode } from 'react'

import styles from './Toast.module.css'

export type ToastTone = 'success' | 'error' | 'info'

export interface ToastProps {
  /** @default 'info' */
  tone?: ToastTone
  children?: ReactNode
  /** Click-anywhere dismiss handler. */
  onDismiss?: () => void
}

const Toast: FC<ToastProps> = ({ tone = 'info', children, onDismiss }) => {
  return (
    <ListItem className={styles.item}>
      <button
        type="button"
        className={[styles.toast, styles[tone]].filter(Boolean).join(' ')}
        onClick={onDismiss}
      >
        <span className={styles.message}>{children}</span>
        <span className={styles.close} aria-hidden="true">
          &times;
        </span>
      </button>
    </ListItem>
  )
}

export default Toast
