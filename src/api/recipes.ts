import type { RecipeIndex, Recipe, Tag } from '../types/recipe'

const API_BASE = 'https://api.akli.dev'

export const fetchRecipes = async (): Promise<RecipeIndex[]> => {
  throw new Error('Not implemented')
}

export const fetchRecipe = async (slug: string): Promise<Recipe> => {
  throw new Error('Not implemented')
}

export const fetchTags = async (): Promise<Tag[]> => {
  throw new Error('Not implemented')
}
