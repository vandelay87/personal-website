import SkipLink from '@components/SkipLink'
import type { FC, ReactNode } from 'react'

import { MAIN_LANDMARK_ID } from '../../constants/mainLandmark'
import styles from './PageShell.module.css'

export interface PageShellProps {
  header: ReactNode
  footer: ReactNode
  /**
   * Overrides the default "site column" `<main>` look (max-width, padding,
   * background) — e.g. AdminLayout's flex-fill admin content styling.
   */
  mainClassName?: string
  children: ReactNode
}

const PageShell: FC<PageShellProps> = ({ header, footer, mainClassName, children }) => (
  <>
    <SkipLink />
    {header}
    <main id={MAIN_LANDMARK_ID} tabIndex={-1} className={mainClassName ?? styles.main}>
      {children}
    </main>
    {footer}
  </>
)

export default PageShell
