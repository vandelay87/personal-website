import type { Recipe } from '@models/recipe'
import { createContext } from 'react'

export interface RecipeData {
  recipe?: Recipe
}

export const RecipeDataContext = createContext<RecipeData>({})
