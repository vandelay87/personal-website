import Loading from '@components/Loading'
import { FC } from 'react'
import styles from './FileMeta.module.css'

interface FileInfo {
  type: string
  size: string
  date?: string
}

interface FileMetaProps {
  fileInfo: FileInfo | null
  hasError: boolean
}

const FileMeta: FC<FileMetaProps> = ({ fileInfo, hasError }) => {
  if (hasError) {
    return <span className={styles.error}>Failed to load CV metadata</span>
  }

  if (fileInfo) {
    const { type, size, date } = fileInfo

    return (
      <ul role="list" className={styles.list}>
        <li>{`${type} format`}</li>
        <li aria-hidden="true">•</li>
        <li>{size}</li>
        {date && (
          <>
            <li aria-hidden="true">•</li>
            <li>Updated {date}</li>
          </>
        )}
      </ul>
    )
  }

  return <Loading />
}

export default FileMeta
