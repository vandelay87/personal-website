import { useEffect, useState, type FC } from 'react'
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

const ProcessingPlaceholder: FC<ProcessingPlaceholderProps> = ({
  aspectRatio,
  height,
  caption = 'Processing image…',
  small = false,
  className = '',
}) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return

    const mediaQueryList = window.matchMedia(REDUCED_MOTION_QUERY)
    setPrefersReducedMotion(mediaQueryList.matches)

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches)
    }

    mediaQueryList.addEventListener('change', handleChange)
    return () => {
      mediaQueryList.removeEventListener('change', handleChange)
    }
  }, [])

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
