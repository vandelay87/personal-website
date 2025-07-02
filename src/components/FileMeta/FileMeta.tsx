import Loading from '@components/Loading'

const FileMeta = ({
  fileInfo,
  hasError,
}: {
  fileInfo: { type: string; date: string; size: string } | null
  hasError: boolean
}) => {
  if (fileInfo) {
    return (
      <ul role="list" className="inline-flex items-center space-x-1">
        <li>{fileInfo.type} format</li>
        <li aria-hidden="true">•</li>
        <li>{fileInfo.size}</li>
        <li aria-hidden="true">•</li>
        <li>Updated {fileInfo.date}</li>
      </ul>
    )
  }

  if (hasError) {
    return <span className="text-red-500 dark:text-red-400">Failed to load CV metadata</span>
  }

  return <Loading />
}

export default FileMeta
