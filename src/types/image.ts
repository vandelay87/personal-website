export const IMAGE_BASE = 'https://images.akli.dev'

export type ImageVariant = 'thumb' | 'medium' | 'full'

export const IMAGE_VARIANT_WIDTHS: Record<ImageVariant, number> = {
  thumb: 400,
  medium: 800,
  full: 1200,
}

export const blogImageUrl = (slug: string, stem: string, variant: ImageVariant): string =>
  `${IMAGE_BASE}/blog/${slug}/${stem}-${variant}.webp`

export const imageSrcSet = (
  urlFor: (variant: ImageVariant) => string,
  variants: readonly ImageVariant[],
): string =>
  variants.map((variant) => `${urlFor(variant)} ${IMAGE_VARIANT_WIDTHS[variant]}w`).join(', ')

export const blogImageSources = (
  slug: string,
  stem: string,
  variants: readonly ImageVariant[] = ['medium', 'full'],
): { src: string; srcSet: string } => {
  const urlFor = (variant: ImageVariant) => blogImageUrl(slug, stem, variant)
  return { src: urlFor(variants[0]), srcSet: imageSrcSet(urlFor, variants) }
}
