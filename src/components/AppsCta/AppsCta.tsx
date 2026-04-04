import Link from '@components/Link'
import Typography from '@components/Typography'
import { FC } from 'react'
import styles from './AppsCta.module.css'

const AppsCta: FC = () => {
  return (
    <section
      className={styles.section}
      aria-labelledby="apps-section-title"
    >
      <div className={styles.inner}>
        <Typography variant="heading2" id="apps-section-title" className={styles.heading}>
          Apps & experiments
        </Typography>

        <Typography variant="bodyLarge" className={styles.body}>
          Side projects and experiments I've built to explore ideas and learn
          how things work. Take a look at{' '}
          <Link to="/apps" underline={true}>
            Apps
          </Link>
          .
        </Typography>
      </div>
    </section>
  )
}

export default AppsCta
