import type { FC } from 'react'

import styles from './ImageCaption.module.css'

export interface ImageCaptionProps {
  src: string
  alt: string
  caption?: string
}

const ImageCaption: FC<ImageCaptionProps> = ({ src, alt, caption }) => {
  return (
    <figure className={styles.figure}>
      <img className={styles.image} src={src} alt={alt} />
      {caption && <figcaption className={styles.caption}>{caption}</figcaption>}
    </figure>
  )
}

export default ImageCaption
