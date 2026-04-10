import { useState, useEffect, type FC } from 'react'
import styles from './RecipeSearch.module.css'

export interface RecipeSearchProps {
  onSearch: (query: string) => void
}

const RecipeSearch: FC<RecipeSearchProps> = ({ onSearch }) => {
  const [value, setValue] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(value)
    }, 300)

    return () => clearTimeout(timer)
  }, [value, onSearch])

  return (
    <div className={styles.wrapper}>
      <input
        type="search"
        aria-label="Search recipes"
        placeholder="Search recipes..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className={styles.input}
      />
    </div>
  )
}

export default RecipeSearch
