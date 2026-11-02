import { Image, type ImageProps } from '@akli-dev/ui'
import { blogImageSources, type ImageVariant } from '@models/image'

export interface PostImageProps extends Omit<ImageProps, 'src' | 'srcSet'> {
  slug: string
  stem: string
  variants?: readonly ImageVariant[]
}

const PostImage = ({ slug, stem, variants, ...rest }: PostImageProps) => (
  <Image {...blogImageSources(slug, stem, variants)} {...rest} />
)

export default PostImage
