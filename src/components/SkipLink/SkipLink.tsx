import type { FC } from 'react'
import styles from './SkipLink.module.css'

export interface SkipLinkProps {
  /** id of the landmark to jump to. @default 'main' */
  targetId?: string
}

const SkipLink: FC<SkipLinkProps> = ({ targetId = 'main' }) => (
  <a href={`#${targetId}`} className={styles.skipLink}>
    Skip to main content
  </a>
)

export default SkipLink
