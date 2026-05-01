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

export const fetchRecipeByIdAdmin = async (
  token: string,
  id: string,
  signal?: AbortSignal
): Promise<Recipe> => {
  const response = await fetch(`${API_BASE}/recipes/admin/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  })
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`)
  }
  return response.json()
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

// Dev-only: route the S3 PUT through the vite proxy so the browser sees a
// same-origin request. The prod bucket's CORS only allows https://akli.dev.
const applyDevS3Proxy = (uploadUrl: string): string => {
  const bucketHost = import.meta.env.VITE_S3_BUCKET_HOST
  if (!import.meta.env.DEV || !bucketHost) return uploadUrl
  return uploadUrl.replace(`https://${bucketHost}`, '/s3-upload')
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
  const { uploadUrl, key }: { uploadUrl: string; key: string } = await response.json()
  return { uploadUrl: applyDevS3Proxy(uploadUrl), key }
}
