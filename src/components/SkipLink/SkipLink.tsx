import type { FC } from 'react'

import { MAIN_LANDMARK_ID } from '../../constants/mainLandmark'
import styles from './SkipLink.module.css'

export interface SkipLinkProps {
  /** id of the landmark to jump to. @default MAIN_LANDMARK_ID ('main') */
  targetId?: string
}

const SkipLink: FC<SkipLinkProps> = ({ targetId = MAIN_LANDMARK_ID }) => (
  <a href={`#${targetId}`} className={styles.skipLink}>
    Skip to main content
  </a>
)

export default SkipLink
