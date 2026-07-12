import List, { ListItem } from '@components/List'
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
      <List className={styles.list}>
        <ListItem>{`${type} format`}</ListItem>
        <li aria-hidden="true">•</li>
        <ListItem>{size}</ListItem>
        {date && (
          <>
            <li aria-hidden="true">•</li>
            <ListItem>Updated {date}</ListItem>
          </>
        )}
      </List>
    )
  }

  return <Loading />
}

export default FileMeta
