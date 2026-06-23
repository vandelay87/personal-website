export const RECIPE_IMAGE_BASE = 'https://images.akli.dev'

export type RecipeImageVariant = 'thumb' | 'medium' | 'full'

export type ImageType = 'cover' | `step-${string}`

export const recipeImageUrl = (
  slug: string,
  imageType: ImageType,
  variant: RecipeImageVariant,
): string => `${RECIPE_IMAGE_BASE}/recipes/${slug}/${imageType}-${variant}.webp`

export const stepImageType = (stepId: string): ImageType => `step-${stepId}`

export const parseImageType = (
  imageType: ImageType,
): { kind: 'cover' } | { kind: 'step'; stepId: string } =>
  imageType === 'cover'
    ? { kind: 'cover' }
    : { kind: 'step', stepId: imageType.slice('step-'.length) }

export interface ImageReadyUpdate {
  imageType: ImageType
  processedAt: number
}

export const sluggify = (input: string): string =>
  input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)

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

export const applyStepReadiness = (steps: Step[], updates: ImageReadyUpdate[]): Step[] => {
  const byImageType = new Map(updates.map((u) => [u.imageType, u.processedAt]))
  let changed = false
  const nextSteps = steps.map((step) => {
    if (!step.image) return step
    const processedAt = byImageType.get(stepImageType(step.stepId))
    if (processedAt === undefined) return step
    changed = true
    return { ...step, image: { ...step.image, processedAt } }
  })
  return changed ? nextSteps : steps
}
