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
    <ul className={`${styles.grid} ${columnClassMap[columns]}`}>
      {Array.isArray(children) ? (
        children.map((child, index) => (
          <li key={index} className={styles.item}>
            {child}
          </li>
        ))
      ) : (
        <li className={styles.item}>{children}</li>
      )}
    </ul>
  )
}

export default Grid
