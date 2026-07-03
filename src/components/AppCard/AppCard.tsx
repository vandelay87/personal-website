import Image from '@components/Image'
import type { ImageProps } from '@components/Image/Image'
import Typography from '@components/Typography'
import type { FC } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import styles from './AppCard.module.css'

export interface AppCardProps {
  title: string
  description: string
  href: string
  image: ImageProps
}

const isExternalHref = (href: string) =>
  /^https?:\/\//.test(href) || href.startsWith('mailto:') || href.startsWith('tel:')

const AppCard: FC<AppCardProps> = ({ title, description, href, image }) => {
  const content = (
    <>
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

        <span className={styles.openApp}>
          Open app <span aria-hidden="true">↗</span>
        </span>
      </div>
    </>
  )

  if (isExternalHref(href)) {
    return (
      <a href={href} className={styles.card} target="_blank" rel="noreferrer">
        {content}
      </a>
    )
  }

  return (
    <RouterLink to={href} className={styles.card}>
      {content}
    </RouterLink>
  )
}

export default AppCard
