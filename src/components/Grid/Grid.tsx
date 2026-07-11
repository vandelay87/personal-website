import { CSSProperties, FC, ReactNode } from 'react'
import styles from './Grid.module.css'

interface GridProps {
  children: ReactNode
  columns?: 1 | 2 | 3 | 4
  minWidth?: string
  className?: string
}

const columnClassMap: Record<NonNullable<GridProps['columns']>, string> = {
  1: styles.cols1,
  2: styles.cols2,
  3: styles.cols3,
  4: styles.cols4,
}

const Grid: FC<GridProps> = ({
  children,
  columns = 3,
  minWidth,
  className: extraClassName,
}) => {
  const gridClassName = [
    styles.grid,
    minWidth ? styles.autoFit : columnClassMap[columns],
    extraClassName,
  ]
    .filter(Boolean)
    .join(' ')

  const gridStyle = minWidth
    ? ({ '--grid-min-width': minWidth } as CSSProperties)
    : undefined

  return (
    // eslint-disable-next-line jsx-a11y/no-redundant-roles -- .grid sets list-style: none, which drops implicit list semantics in Safari/VoiceOver; role="list" (paired with role="listitem" on each <li>) restores it
    <ul className={gridClassName} style={gridStyle} role="list">
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
