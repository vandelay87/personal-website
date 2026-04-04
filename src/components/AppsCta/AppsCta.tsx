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
          Side projects and experiments I've built to explore ideas and learn
          how things work. Take a look at{' '}
          <Link to="/apps" underline={true}>
            Apps
          </Link>
          .
        </p>
      </div>
    </section>
  )
}

export default AppsCta
