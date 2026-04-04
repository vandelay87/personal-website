import styles from './NotFound.module.css'

export default function NotFound() {
  return (
    <section className={styles.container}>
      <h1 className={styles.heading}>
        404 - Page Not Found
      </h1>
      <p className={styles.subtext}>Oops! The page you are looking for does not exist.</p>
      <a href="/" className={styles.homeLink}>Go back home</a>
    </section>
  )
}
