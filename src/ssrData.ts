import type { RecipeData } from '@contexts/RecipeDataContext'

const RECIPE_DATA_GLOBAL = '__RECIPE_DATA__'

export const injectRecipeDataScript = (data: RecipeData): string => {
  if (!data.recipe) return ''
  const json = JSON.stringify(data).replace(/</g, '\\u003c')
  return `<script>window.${RECIPE_DATA_GLOBAL}=${json}</script>`
}

export const readRecipeData = (): RecipeData => {
  if (typeof window === 'undefined') return {}
  return (window as unknown as Record<string, RecipeData | undefined>)[RECIPE_DATA_GLOBAL] ?? {}
}
