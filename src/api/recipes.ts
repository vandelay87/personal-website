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

export const fetchMyRecipes = async (_token: string): Promise<Recipe[]> => {
  throw new Error('Not implemented')
}

export const createRecipe = async (_token: string, _data: Partial<Recipe>): Promise<Recipe> => {
  throw new Error('Not implemented')
}

export const updateRecipe = async (
  _token: string,
  _id: string,
  _data: Partial<Recipe>
): Promise<Recipe> => {
  throw new Error('Not implemented')
}

export const publishRecipe = async (_token: string, _id: string): Promise<void> => {
  throw new Error('Not implemented')
}

export const unpublishRecipe = async (_token: string, _id: string): Promise<void> => {
  throw new Error('Not implemented')
}

export const deleteRecipe = async (_token: string, _id: string): Promise<void> => {
  throw new Error('Not implemented')
}

export const getUploadUrl = async (
  _token: string,
  _params: { recipeId: string; imageType: string; stepOrder?: number }
): Promise<{ uploadUrl: string; key: string }> => {
  throw new Error('Not implemented')
}
