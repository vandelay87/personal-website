import { FC, ReactNode } from 'react'
import styles from './Grid.module.css'

interface GridProps {
  children: ReactNode
  columns?: 1 | 2 | 3 | 4
}

const columnClassMap: Record<NonNullable<GridProps['columns']>, string> = {
  1: styles.cols1,
  2: styles.cols2,
  3: styles.cols3,
  4: styles.cols4,
}

const Grid: FC<GridProps> = ({ children, columns = 3 }) => {
  return (
    // Safari/VoiceOver drops list semantics from a <ul>/<li> pair once
    // `list-style: none` is applied anywhere in it; role="list" (paired
    // with role="listitem" below) restores it explicitly.
    // eslint-disable-next-line jsx-a11y/no-redundant-roles -- not redundant, see comment above
    <ul className={`${styles.grid} ${columnClassMap[columns]}`} role="list">
      {Array.isArray(children) ? (
        children.map((child, index) => (
          // eslint-disable-next-line jsx-a11y/no-redundant-roles -- not redundant, see comment on the <ul> above
          <li key={index} className={styles.item} role="listitem">
            {child}
          </li>
        ))
      ) : (
        // eslint-disable-next-line jsx-a11y/no-redundant-roles -- not redundant, see comment on the <ul> above
        <li className={styles.item} role="listitem">{children}</li>
      )}
    </ul>
  )
}

export default Grid
