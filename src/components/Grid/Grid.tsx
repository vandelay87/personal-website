import { FC, ReactNode } from 'react'

interface GridProps {
  children: ReactNode
  columns?: 1 | 2 | 3 | 4
}

const Grid: FC<GridProps> = ({ children, columns = 3 }) => {
  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }

  return (
    <ul className={`grid gap-6 md:gap-8 ${columnClasses[columns]}`}>
      {Array.isArray(children) ? (
        children.map((child, index) => (
          <li key={index} className="list-none">
            {child}
          </li>
        ))
      ) : (
        <li className="list-none">{children}</li>
      )}
    </ul>
  )
}

export default Grid
