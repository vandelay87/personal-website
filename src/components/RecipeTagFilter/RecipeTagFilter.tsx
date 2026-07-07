import TagChip from '@components/Tag'
import type { Tag } from '@models/recipe'
import type { FC } from 'react'
import styles from './RecipeTagFilter.module.css'

export interface RecipeTagFilterProps {
  tags: Tag[]
  activeTag: string | null
  onTagClick: (tag: string) => void
  onClear: () => void
}

const RecipeTagFilter: FC<RecipeTagFilterProps> = ({ tags, activeTag, onTagClick, onClear }) => {
  return (
    <div className={styles.wrapper} role="group" aria-label="Filter by tag">
      <TagChip as="button" active={activeTag === null} onClick={onClear}>
        All
      </TagChip>
      {tags.map(({ tag, count }) => (
        <TagChip
          key={tag}
          as="button"
          active={activeTag === tag}
          onClick={() => onTagClick(tag)}
        >
          {tag} ({count})
        </TagChip>
      ))}
    </div>
  )
}

export default RecipeTagFilter
