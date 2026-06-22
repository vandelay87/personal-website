export const RECIPE_IMAGE_BASE = 'https://images.akli.dev'

export type RecipeImageVariant = 'thumb' | 'medium' | 'full'

export const recipeImageUrl = (
  _slug: string,
  _imageType: 'cover' | `step-${string}`,
  _variant: RecipeImageVariant,
): string => {
  throw new Error('not implemented')
}

export const sluggify = (_input: string): string => {
  throw new Error('not implemented')
}

export interface RecipeImage {
  alt: string
  processedAt?: number
}

export interface Ingredient {
  item: string
  quantity: string
  unit: string
}

export interface Step {
  stepId: string
  order: number
  text: string
  image?: RecipeImage
}

export interface Tag {
  tag: string
  count: number
}

export interface RecipeIndex {
  id: string
  title: string
  slug: string
  coverImage: RecipeImage
  tags: string[]
  prepTime: number
  cookTime: number
  servings: number
  createdAt: string
}

export interface Recipe extends RecipeIndex {
  intro: string
  ingredients: Ingredient[]
  steps: Step[]
  authorId: string
  authorName: string
  updatedAt: string
  status: 'draft' | 'published'
  ttl?: number
}
