import type { FC, ReactNode } from 'react'

import styles from './Callout.module.css'

export interface CalloutProps {
  type: 'tip' | 'warning' | 'info'
  children: ReactNode
}

const indicators: Record<CalloutProps['type'], string> = {
  tip: '💡 Tip',
  warning: '⚠️ Warning',
  info: 'ℹ️ Info',
}

const Callout: FC<CalloutProps> = ({ type, children }) => {
  return (
    <div className={`${styles.callout} ${styles[type]}`} role="note">
      <div className={styles.indicator}>{indicators[type]}</div>
      <div>{children}</div>
    </div>
  )
}

export default Callout
