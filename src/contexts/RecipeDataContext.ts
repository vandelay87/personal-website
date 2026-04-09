import { createContext } from 'react'
import type { Recipe } from '../types/recipe'

export interface RecipeData {
  recipe?: Recipe
}

export const RecipeDataContext = createContext<RecipeData>({})
