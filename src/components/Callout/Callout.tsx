import type { FC, ReactNode } from 'react'

import styles from './Callout.module.css'

export interface CalloutProps {
  type: 'tip' | 'warning' | 'info'
  children: ReactNode
}

const indicators: Record<CalloutProps['type'], { emoji: string; label: string }> = {
  tip: { emoji: '💡', label: 'Tip' },
  warning: { emoji: '⚠️', label: 'Warning' },
  info: { emoji: 'ℹ️', label: 'Info' },
}

const Callout: FC<CalloutProps> = ({ type, children }) => {
  return (
    <div className={`${styles.callout} ${styles[type]}`} role="note" aria-label={indicators[type].label}>
      <div className={styles.accentBar} />
      <div className={styles.content}>
        <div className={styles.indicator}><span aria-hidden="true">{indicators[type].emoji}</span> {indicators[type].label}</div>
        <div>{children}</div>
      </div>
    </div>
  )
}

export default Callout
