import { blogImageSources, blogImageUrl, IMAGE_BASE, imageSrcSet, type ImageVariant } from '@models/image'
import { describe, it, expect } from 'vitest'

describe('IMAGE_BASE', () => {
  it('points at the images.akli.dev CDN host', () => {
    expect(IMAGE_BASE).toBe('https://images.akli.dev')
  })
})

describe('blogImageUrl', () => {
  it.each<[ImageVariant, string]>([
    ['thumb', 'https://images.akli.dev/blog/building-a-pokedex/pokedex-desktop-thumb.webp'],
    ['medium', 'https://images.akli.dev/blog/building-a-pokedex/pokedex-desktop-medium.webp'],
    ['full', 'https://images.akli.dev/blog/building-a-pokedex/pokedex-desktop-full.webp'],
  ])('builds a /blog URL from the post slug and stem with the %s variant suffix', (variant, expected) => {
    expect(blogImageUrl('building-a-pokedex', 'pokedex-desktop', variant)).toBe(expected)
  })
})

describe('imageSrcSet', () => {
  it('joins each variant URL with its width descriptor in the given order', () => {
    expect(imageSrcSet((variant) => `/img-${variant}.webp`, ['medium', 'full'])).toBe(
      '/img-medium.webp 800w, /img-full.webp 1200w'
    )
  })

  it('uses the 400w descriptor for the thumb variant', () => {
    expect(imageSrcSet((variant) => `/img-${variant}.webp`, ['thumb'])).toBe('/img-thumb.webp 400w')
  })
})

describe('blogImageSources', () => {
  it('defaults to the medium variant as src with medium and full in srcSet', () => {
    expect(blogImageSources('a-post', 'screenshot')).toEqual({
      src: 'https://images.akli.dev/blog/a-post/screenshot-medium.webp',
      srcSet:
        'https://images.akli.dev/blog/a-post/screenshot-medium.webp 800w, https://images.akli.dev/blog/a-post/screenshot-full.webp 1200w',
    })
  })

  it('uses the first given variant as src', () => {
    expect(blogImageSources('a-post', 'mobile', ['thumb', 'medium'])).toEqual({
      src: 'https://images.akli.dev/blog/a-post/mobile-thumb.webp',
      srcSet:
        'https://images.akli.dev/blog/a-post/mobile-thumb.webp 400w, https://images.akli.dev/blog/a-post/mobile-medium.webp 800w',
    })
  })
})
