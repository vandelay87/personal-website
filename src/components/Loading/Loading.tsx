const Loading = () => {
  return (
    <span
      role="status"
      aria-live="polite"
      aria-label="Loading content"
      className="inline-block w-[1em] h-[1em] align-middle animate-spin rounded-full border-[0.15em] border-gray-400 border-t-transparent dark:border-gray-500 dark:border-t-transparent"
    />
  )
}

export default Loading
