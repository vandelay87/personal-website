import Loading from '@components/Loading'
import { FC } from 'react'

interface FileInfo {
  type: string
  date: string
  size: string
}

interface FileMetaProps {
  fileInfo: FileInfo | null
  hasError: boolean
}

const FileMeta: FC<FileMetaProps> = ({ fileInfo, hasError }) => {
  if (hasError) {
    return <span className="text-red-500 dark:text-red-400">Failed to load CV metadata</span>
  }

  if (fileInfo) {
    const { type, size, date } = fileInfo

    return (
      <ul role="list" className="inline-flex items-center space-x-1">
        <li>{type} format</li>
        <li aria-hidden="true">•</li>
        <li>{size}</li>
        <li aria-hidden="true">•</li>
        <li>Updated {date}</li>
      </ul>
    )
  }

  return <Loading />
}

export default FileMeta
