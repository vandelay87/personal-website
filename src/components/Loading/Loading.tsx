import styles from './Loading.module.css'

const Loading = () => {
  return (
    <span
      role="status"
      aria-live="polite"
      aria-label="Loading content"
      className={styles.spinner}
    />
  )
}

export default Loading
