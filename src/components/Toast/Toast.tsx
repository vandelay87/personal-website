import Button from '@components/Button'
import { useEffect, useRef, type FC } from 'react'


import styles from './Toast.module.css'

export interface ToastState {
  message: string
  type: 'success' | 'error'
}

export interface ToastProps extends ToastState {
  onDismiss: () => void
}

const Toast: FC<ToastProps> = ({ message, type, onDismiss }) => {
  const onDismissRef = useRef(onDismiss)
  onDismissRef.current = onDismiss

  useEffect(() => {
    const timer = setTimeout(() => onDismissRef.current(), 5000)
    return () => clearTimeout(timer)
  }, [])

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
