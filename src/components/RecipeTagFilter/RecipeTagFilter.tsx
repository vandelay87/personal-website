import type { Tag } from '../../types/recipe'

export interface RecipeTagFilterProps {
  tags: Tag[]
  activeTag: string | null
  onTagClick: (tag: string) => void
}

const RecipeTagFilter = (_props: RecipeTagFilterProps) => {
  return null
}

export default RecipeTagFilter
