import { blogImageSources, blogImageUrl } from '@models/image'
import type { PostHero } from './index'

export const testPostHero: PostHero = {
  image: {
    ...blogImageSources('test-post', 'hero'),
    alt: 'Hero image for the test post',
    caption: 'The test post hero caption',
  },
  ogImage: blogImageUrl('test-post', 'hero', 'full'),
}
