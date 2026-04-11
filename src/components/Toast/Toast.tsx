import Button from '@components/Button'
import { useEffect, type FC } from 'react'


import styles from './Toast.module.css'

export interface ToastProps {
  message: string
  type: 'success' | 'error'
  onDismiss: () => void
}

const Toast: FC<ToastProps> = ({ message, type, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <div
      role="status"
      aria-live="polite"
      className={[styles.toast, styles[type]].join(' ')}
    >
      <span className={styles.message}>{message}</span>
      <Button onClick={onDismiss} ariaLabel="Close" variant="secondary" className={styles.close}>
        &times;
      </Button>
    </div>
  )
}

export default Toast
