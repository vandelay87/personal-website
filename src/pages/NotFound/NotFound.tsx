import Typography from '@components/Typography'
import styles from './NotFound.module.css'

export default function NotFound() {
  return (
    <section className={styles.container}>
      <Typography variant="heading1" className={styles.heading}>
        404 - Page Not Found
      </Typography>
      <Typography variant="bodyLarge" className={styles.subtext}>Oops! The page you are looking for does not exist.</Typography>
      <a href="/" className={styles.homeLink}>Go back home</a>
    </section>
  )
}
