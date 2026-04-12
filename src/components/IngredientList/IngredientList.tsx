import type { Ingredient } from '@types/recipe'
import type { FC } from 'react'

export interface IngredientListProps {
  ingredients: Ingredient[]
  onChange: (ingredients: Ingredient[]) => void
}

const IngredientList: FC<IngredientListProps> = () => {
  return null
}

export default IngredientList
