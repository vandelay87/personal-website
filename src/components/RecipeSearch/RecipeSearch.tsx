import Input from '@components/Input'
import { useState, useEffect, type FC } from 'react'
import styles from './RecipeSearch.module.css'

export interface RecipeSearchProps {
  value: string
  onSearch: (query: string) => void
}

const searchIcon = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.5" y2="16.5" />
  </svg>
)

const RecipeSearch: FC<RecipeSearchProps> = ({ value: controlledValue, onSearch }) => {
  const [value, setValue] = useState(controlledValue)

  // Adjusted here during render (React's "adjusting state when a prop
  // changes" pattern) rather than in an effect, since resyncing to a new
  // controlled value doesn't need to synchronize with anything external.
  const [prevControlledValue, setPrevControlledValue] = useState(controlledValue)
  if (controlledValue !== prevControlledValue) {
    setPrevControlledValue(controlledValue)
    setValue(controlledValue)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(value)
    }, 300)

    return () => clearTimeout(timer)
  }, [value, onSearch])

  return (
    <form className={styles.wrapper} role="search" onSubmit={(e) => e.preventDefault()}>
      <Input
        type="search"
        ariaLabel="Search recipes"
        placeholder="Search recipes…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className={styles.input}
        prefixIcon={searchIcon}
        suffix={
          value && (
            <button
              type="button"
              className={styles.clearButton}
              aria-label="Clear search"
              onClick={() => setValue('')}
            >
              <span aria-hidden="true">✕</span>
            </button>
          )
        }
      />
    </form>
  )
}

export default RecipeSearch
