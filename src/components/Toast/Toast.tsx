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
    // Safari/VoiceOver drops list semantics from a <ul>/<li> pair once
    // `list-style: none` is applied anywhere in it; role="listitem" (paired
    // with role="list" on the <ul> in ToastProvider) restores it explicitly.
    // eslint-disable-next-line jsx-a11y/no-redundant-roles -- not redundant, see comment above
    <li className={styles.item} role="listitem">
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
    </li>
  )
}

export default Toast
