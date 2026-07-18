import { useSyncExternalStore, type FC } from 'react'
import styles from './ProcessingPlaceholder.module.css'

export interface ProcessingPlaceholderProps {
  aspectRatio?: string
  height?: string
  caption?: string
  /** Compact variant (step thumbnails). @default false */
  small?: boolean
  className?: string
}

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

const canUseMatchMedia = (): boolean => typeof window !== 'undefined' && !!window.matchMedia

const subscribeToReducedMotion = (onStoreChange: () => void) => {
  if (!canUseMatchMedia()) return () => {}
  const mediaQueryList = window.matchMedia(REDUCED_MOTION_QUERY)
  mediaQueryList.addEventListener('change', onStoreChange)
  return () => mediaQueryList.removeEventListener('change', onStoreChange)
}

const getReducedMotionSnapshot = (): boolean =>
  canUseMatchMedia() && window.matchMedia(REDUCED_MOTION_QUERY).matches

const getReducedMotionServerSnapshot = () => false

const ProcessingPlaceholder: FC<ProcessingPlaceholderProps> = ({
  aspectRatio,
  height,
  caption = 'Processing image…',
  small = false,
  className = '',
}) => {
  // Subscribes directly to the OS-level reduced-motion preference via
  // useSyncExternalStore rather than an effect + setState, since this is
  // exactly the "syncing with an external system" case it exists for.
  const prefersReducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  )

  const rootClassName = [
    styles.root,
    small ? styles.small : '',
    prefersReducedMotion ? styles.reducedMotion : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <figure className={rootClassName}>
      <div
        className={styles.inner}
        style={{ aspectRatio: aspectRatio ?? undefined, height }}
      >
        <div className={styles.overlay} aria-hidden="true" />
      </div>
      <figcaption className={small ? 'sr-only' : styles.caption}>{caption}</figcaption>
    </figure>
  )
}

export default ProcessingPlaceholder
