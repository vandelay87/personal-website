import type { AutosaveStatus as AutosaveStatusValue } from '@hooks/useAutosave'
import type { FC } from 'react'
import { useEffect, useState } from 'react'
import styles from './AutosaveStatus.module.css'

export interface AutosaveStatusProps {
  status: AutosaveStatusValue
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

const TRANSITION_TEXT: Record<AutosaveStatusValue, string> = {
  idle: '',
  saving: 'Saving…',
  saved: 'Saved',
  error: 'Failed to save',
}

const ICON_CLASS: Record<AutosaveStatusValue, string | undefined> = {
  idle: undefined,
  saving: styles.iconSaving,
  saved: styles.iconSaved,
  error: styles.iconError,
}

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
  const transitionText = TRANSITION_TEXT[status]
  const iconClass = ICON_CLASS[status]

  return (
    <span className={styles.container}>
      <span role="status" aria-live={ariaLive} className={styles.liveRegion}>
        {status !== 'idle' && (
          <>
            <span aria-hidden="true" className={cx(styles.icon, iconClass)} />
            <span className={styles.text}>{transitionText}</span>
          </>
        )}
      </span>
      {status === 'saved' && lastSavedAt !== null && (
        <span aria-hidden="true" className={styles.relativeTime}>
          {`· ${formatRelativeTime(lastSavedAt, new Date(now))}`}
        </span>
      )}
      {status === 'error' && (
        <button
          type="button"
          className={styles.retryButton}
          onClick={() => { onRetry() }}
        >
          Retry
        </button>
      )}
    </span>
  )
}

export default AutosaveStatus
