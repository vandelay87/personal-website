import type { FC, JSX } from 'react'
import { useEffect, useState } from 'react'
import styles from './AutosaveStatus.module.css'

export interface AutosaveStatusProps {
  status: 'idle' | 'saving' | 'saved' | 'error'
  lastSavedAt: Date | null
  onRetry: () => void
}

const MINUTE_MS = 60_000

const formatRelativeTime = (date: Date, now: Date): string => {
  const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffSeconds < 60) return 'just now'
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`
  if (diffSeconds < 86_400) return `${Math.floor(diffSeconds / 3600)}h ago`
  return `${Math.floor(diffSeconds / 86_400)}d ago`
}

const cx = (...classNames: Array<string | false | undefined>): string =>
  classNames.filter(Boolean).join(' ')

const AutosaveStatus: FC<AutosaveStatusProps> = ({ status, lastSavedAt, onRetry }) => {
  const [now, setNow] = useState<number>(() => Date.now())

  useEffect(() => {
    if (status !== 'saved' || lastSavedAt === null) return

    const intervalId = setInterval(() => {
      setNow(Date.now())
    }, MINUTE_MS)

    return () => {
      clearInterval(intervalId)
    }
  }, [status, lastSavedAt])

  const ariaLive = status === 'error' ? 'assertive' : 'polite'

  const renderIcon = (stateClass: string): JSX.Element => (
    <span aria-hidden="true" className={cx(styles.icon, stateClass)} />
  )

  return (
    <span role="status" aria-live={ariaLive} className={styles.container}>
      {status === 'saving' && (
        <>
          {renderIcon(styles.iconSaving)}
          <span className={styles.text}>Saving…</span>
        </>
      )}
      {status === 'saved' && lastSavedAt !== null && (
        <>
          {renderIcon(styles.iconSaved)}
          <span aria-live="off" className={cx(styles.text, styles.relativeTime)}>
            {`Saved · ${formatRelativeTime(lastSavedAt, new Date(now))}`}
          </span>
        </>
      )}
      {status === 'error' && (
        <>
          {renderIcon(styles.iconError)}
          <span className={styles.text}>
            Failed to save ·{' '}
            <button
              type="button"
              className={styles.retryButton}
              onClick={() => { onRetry() }}
            >
              Retry
            </button>
          </span>
        </>
      )}
    </span>
  )
}

export default AutosaveStatus
