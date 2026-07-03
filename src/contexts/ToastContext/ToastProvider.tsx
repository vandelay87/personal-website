import Toast, { type ToastTone } from '@components/Toast'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FC,
  type ReactNode,
} from 'react'
import { ToastContext } from './context'
import styles from './ToastProvider.module.css'

interface ToastItem {
  id: string
  message: string
  tone: ToastTone
}

const AUTO_DISMISS_MS = 3600

export const ToastProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const showToast = useCallback((message: string, tone: ToastTone = 'info') => {
    const id = crypto.randomUUID()
    setToasts((current) => [...current, { id, message, tone }])
    timers.current.set(
      id,
      setTimeout(() => dismissToast(id), AUTO_DISMISS_MS)
    )
  }, [dismissToast])

  useEffect(() => {
    const timerMap = timers.current
    return () => {
      timerMap.forEach(clearTimeout)
    }
  }, [])

  const value = useMemo(() => ({ showToast }), [showToast])
  const hasError = toasts.some((toast) => toast.tone === 'error')

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className={styles.container}
        aria-live={hasError ? 'assertive' : 'polite'}
        aria-atomic="false"
      >
        {/* eslint-disable-next-line jsx-a11y/no-redundant-roles -- Toast's .item sets list-style: none, which drops implicit list semantics in Safari/VoiceOver; role="list" (paired with role="listitem" in Toast) restores it */}
        <ul className={styles.list} role="list">
          {toasts.map((toast) => (
            <Toast key={toast.id} tone={toast.tone} onDismiss={() => dismissToast(toast.id)}>
              {toast.message}
            </Toast>
          ))}
        </ul>
      </div>
    </ToastContext.Provider>
  )
}
