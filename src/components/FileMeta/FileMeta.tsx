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
      // Safari/VoiceOver drops list semantics from a <ul>/<li> pair once
      // `list-style: none` is applied anywhere in it; role="list" (paired
      // with role="listitem" below) restores it explicitly.
      // eslint-disable-next-line jsx-a11y/no-redundant-roles -- not redundant, see comment above
      <ul className={styles.list} role="list">
        {/* eslint-disable-next-line jsx-a11y/no-redundant-roles -- not redundant, see comment on the <ul> above */}
        <li role="listitem">{`${type} format`}</li>
        <li aria-hidden="true">•</li>
        {/* eslint-disable-next-line jsx-a11y/no-redundant-roles -- not redundant, see comment on the <ul> above */}
        <li role="listitem">{size}</li>
        {date && (
          <>
            <li aria-hidden="true">•</li>
            {/* eslint-disable-next-line jsx-a11y/no-redundant-roles -- not redundant, see comment on the <ul> above */}
            <li role="listitem">Updated {date}</li>
          </>
        )}
      </ul>
    )
  }

  return <Loading />
}

export default FileMeta
