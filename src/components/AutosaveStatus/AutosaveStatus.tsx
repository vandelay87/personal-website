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

const TRANSITION_TEXT: Record<AutosaveStatusValue, string> = {
  idle: '',
  saving: 'Saving…',
  saved: 'Saved',
  error: "Couldn't save",
}

// Hoisted elements, not components — these never take props, so there's no
// need to re-invoke a function (and rebuild the tree) on every render; see
// `iconRetry` in src/pages/admin/RecipeList/RecipeList.tsx for the same
// established pattern.
//
// Design: docs/design/paper/pages/Admin Recipe Editor.dc.html's rail
// autosave-indicator markup (checkmark polyline, 15x15, stroke-width 2.4).
const iconCheck = (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.4}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

// Design: same markup's error icon (circle + exclamation, 15x15, stroke-width 2).
const iconWarning = (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
)

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

  return (
    <span className={styles.container}>
      <span role="status" aria-live={ariaLive} className={styles.liveRegion}>
        {status === 'saving' && (
          <span aria-hidden="true" className={styles.spinner} />
        )}
        {status === 'saved' && (
          <span aria-hidden="true" className={styles.iconSaved}>
            {iconCheck}
          </span>
        )}
        {status === 'error' && (
          <span aria-hidden="true" className={styles.iconError}>
            {iconWarning}
          </span>
        )}
        {status !== 'idle' && <span className={styles.text}>{transitionText}</span>}
      </span>
      {status === 'saved' && lastSavedAt !== null && (
        <span aria-hidden="true" className={styles.relativeTime}>
          {formatRelativeTime(lastSavedAt, new Date(now))}
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
