import Loading from '@components/Loading'
import SemanticList, { SemanticListItem } from '@components/SemanticList'
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
      <SemanticList className={styles.list}>
        <SemanticListItem>{`${type} format`}</SemanticListItem>
        <li aria-hidden="true">•</li>
        <SemanticListItem>{size}</SemanticListItem>
        {date && (
          <>
            <li aria-hidden="true">•</li>
            <SemanticListItem>Updated {date}</SemanticListItem>
          </>
        )}
      </SemanticList>
    )
  }

  return <Loading />
}

export default FileMeta
