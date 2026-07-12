import SemanticList, { SemanticListItem } from '@components/SemanticList'
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
    <SemanticList className={gridClassName} style={gridStyle}>
      {Array.isArray(children) ? (
        children.map((child, index) => (
          <SemanticListItem key={index} className={styles.item}>
            {child}
          </SemanticListItem>
        ))
      ) : (
        <SemanticListItem className={styles.item}>{children}</SemanticListItem>
      )}
    </SemanticList>
  )
}

export default Grid
