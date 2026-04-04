import Image from '@components/Image'
import type { ImageProps } from '@components/Image/Image'
import Link from '@components/Link'
import type { FC } from 'react'
import styles from './Card.module.css'

export interface CardProps {
  title: string
  description: string
  href: string
  image: ImageProps
}

const Card: FC<CardProps> = ({ title, description, href, image }) => {
  return (
    <article className={styles.card}>
      <div className={styles.imageWrapper}>
        <Image
          {...image}
          className={styles.imageScaled}
          aspectRatio="16/9"
          objectFit="cover"
        />
      </div>

      <div className={styles.body}>
        <h2 className={styles.title}>
          {title}
        </h2>

        <p className={styles.description}>{description}</p>

        <Link to={href}>{href}</Link>
      </div>
    </article>
  )
}

export default Card
