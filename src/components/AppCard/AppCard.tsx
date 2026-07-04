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
      <div className={styles.imageWrapper} aria-hidden="true">
        <Image
          {...image}
          className={styles.imageScaled}
          aspectRatio="16/9"
          objectFit="cover"
        />
      </div>

      <div className={styles.body}>
        <div className={styles.titleRow}>
          <Typography variant="heading3" as="h2" className={styles.title}>
            {title}
          </Typography>

          <span className={styles.arrowIcon} aria-hidden="true">
            ↗
          </span>
        </div>

        <Typography variant="body" className={styles.description}>{description}</Typography>

        <span className={styles.openApp}>Open app</span>
      </div>
    </>
  )

  if (isExternalHref(href)) {
    return (
      <article>
        <a href={href} className={styles.card} target="_blank" rel="noreferrer">
          {content}
        </a>
      </article>
    )
  }

  return (
    <article>
      <RouterLink to={href} className={styles.card}>
        {content}
      </RouterLink>
    </article>
  )
}

export default AppCard
