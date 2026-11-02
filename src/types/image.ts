export const IMAGE_BASE = 'https://images.akli.dev'

export type ImageVariant = 'thumb' | 'medium' | 'full'

export const IMAGE_VARIANT_WIDTHS: Record<ImageVariant, number> = {
  thumb: 400,
  medium: 800,
  full: 1200,
}

export const blogImageUrl = (stem: string, variant: ImageVariant): string =>
  `${IMAGE_BASE}/blog/${stem}-${variant}.webp`

export const imageSrcSet = (
  urlFor: (variant: ImageVariant) => string,
  variants: readonly ImageVariant[],
): string =>
  variants.map((variant) => `${urlFor(variant)} ${IMAGE_VARIANT_WIDTHS[variant]}w`).join(', ')
