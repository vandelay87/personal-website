export const RECIPE_IMAGE_BASE = 'https://akli.dev/images'

export type RecipeImageVariant = 'thumb' | 'medium' | 'full'

export const recipeImageUrl = (key: string, variant: RecipeImageVariant): string =>
  `${RECIPE_IMAGE_BASE}/${key}-${variant}.webp`

export interface RecipeImage {
  key: string
  alt: string
}

export interface Ingredient {
  item: string
  quantity: string
  unit: string
}

export interface Step {
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
