import type { Recipe } from '@models/recipe'
import type { FC } from 'react'

import styles from './StatusBadge.module.css'

export interface StatusBadgeProps {
  status: Recipe['status']
}

const StatusBadge: FC<StatusBadgeProps> = ({ status }) => {
  return (
    <span className={styles.badge} data-status={status}>
      <span className="sr-only">Status: </span>
      {status === 'published' ? 'Published' : 'Draft'}
    </span>
  )
}

export default StatusBadge
