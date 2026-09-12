import type { RecipeData } from '@contexts/RecipeDataContext'

export const injectRecipeDataScript = (_data: RecipeData): string => {
  throw new Error('not implemented')
}

export const readRecipeData = (): RecipeData => {
  throw new Error('not implemented')
}
