import type { RecipeIndex, Recipe, Tag } from '@models/recipe'

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

export const fetchMyRecipes = async (token: string): Promise<Recipe[]> => {
  const response = await fetch(`${API_BASE}/me/recipes`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`)
  }
  return response.json()
}

export const createDraft = async (token: string): Promise<{ id: string; slug: string }> => {
  const response = await fetch(`${API_BASE}/recipes/drafts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`)
  }
  return response.json()
}

export const fetchAllRecipes = async (token: string): Promise<Recipe[]> => {
  const response = await fetch(`${API_BASE}/recipes/admin`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`)
  }
  return response.json()
}

export const fetchRecipeByIdAdmin = async (_token: string, _id: string): Promise<Recipe> => {
  throw new Error('not implemented')
}

export const updateRecipe = async (
  token: string,
  id: string,
  data: Partial<Recipe>,
  signal?: AbortSignal
): Promise<Recipe> => {
  const response = await fetch(`${API_BASE}/recipes/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
    signal,
  })
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`)
  }
  return response.json()
}

export const publishRecipe = async (token: string, id: string): Promise<Recipe> => {
  const response = await fetch(`${API_BASE}/recipes/${id}/publish`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`)
  }
  return response.json()
}

export const unpublishRecipe = async (token: string, id: string): Promise<Recipe> => {
  const response = await fetch(`${API_BASE}/recipes/${id}/unpublish`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`)
  }
  return response.json()
}

export const deleteRecipe = async (token: string, id: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/recipes/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`)
  }
}

export const getUploadUrl = async (
  token: string,
  params: { recipeId: string; imageType: string; stepOrder?: number }
): Promise<{ uploadUrl: string; key: string }> => {
  const response = await fetch(`${API_BASE}/recipes/images/upload-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  })
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`)
  }
  return response.json()
}
