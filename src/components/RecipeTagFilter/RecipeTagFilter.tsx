import Button from '@components/Button'
import type { Tag } from '@models/recipe'
import type { FC } from 'react'
import styles from './RecipeTagFilter.module.css'

export interface RecipeTagFilterProps {
  tags: Tag[]
  activeTag: string | null
  onTagClick: (tag: string) => void
}

const RecipeTagFilter: FC<RecipeTagFilterProps> = ({ tags, activeTag, onTagClick }) => {
  return (
    <div className={styles.wrapper}>
      {tags.map(({ tag, count }) => (
        <Button
          key={tag}
          variant="secondary"
          className={styles.tag}
          ariaPressed={activeTag === tag ? 'true' : 'false'}
          onClick={() => onTagClick(tag)}
        >
          {tag} ({count})
        </Button>
      ))}
    </div>
  )
}

export default RecipeTagFilter
