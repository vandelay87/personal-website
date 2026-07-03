import Image from '@components/Image'
import type { ImageProps } from '@components/Image/Image'
import Link from '@components/Link'
import Typography from '@components/Typography'
import type { FC } from 'react'
import styles from './AppCard.module.css'

export interface AppCardProps {
  title: string
  description: string
  href: string
  image: ImageProps
}

const AppCard: FC<AppCardProps> = ({ title, description, href, image }) => {
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
        <Typography variant="heading3" as="h2" className={styles.title}>
          {title}
        </Typography>

        <Typography variant="body" className={styles.description}>{description}</Typography>

        <Link to={href}>{href}</Link>
      </div>
    </article>
  )
}

export default AppCard
