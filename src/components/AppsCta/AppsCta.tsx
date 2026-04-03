import Link from '@components/Link'
import { FC } from 'react'
import styles from './AppsCta.module.css'

const AppsCta: FC = () => {
  return (
    <section
      className={styles.section}
      aria-labelledby="apps-section-title"
    >
      <div className={styles.inner}>
        <h2 id="apps-section-title" className={styles.heading}>
          Apps & experiments
        </h2>

        <p className={styles.body}>
          A collection of technical demonstrations and tools, ranging from
          physics-based simulations to functional utilities. Explore the{' '}
          <Link to="/apps" underline={true}>
            Apps library
          </Link>
          .
        </p>
      </div>
    </section>
  )
}

export default AppsCta
