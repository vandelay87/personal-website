import type { RecipeIndex, Recipe, Tag } from '@types/recipe'

const API_BASE = import.meta.env.VITE_API_BASE ?? 'https://api.akli.dev'

export const fetchRecipes = async (): Promise<RecipeIndex[]> => {
  const response = await fetch(`${API_BASE}/recipes`)
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`)
  }
  return response.json()
}

export const fetchRecipe = async (slug: string): Promise<Recipe> => {
  const response = await fetch(`${API_BASE}/recipes/${slug}`)
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`)
  }
  return response.json()
}

export const fetchTags = async (): Promise<Tag[]> => {
  const response = await fetch(`${API_BASE}/recipes/tags`)
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`)
  }
  return response.json()
}
