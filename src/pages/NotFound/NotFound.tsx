import styles from './NotFound.module.css'

export default function NotFound() {
  return (
    <section>
      <h1 className={styles.heading}>
        404 - Page Not Found
      </h1>
      <p>Oops! The page you are looking for does not exist.</p>
    </section>
  )
}
