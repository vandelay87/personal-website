import Image from '@components/Image'
import type { ImageProps } from '@components/Image/Image'
import Tag from '@components/Tag'
import Typography from '@components/Typography'
import type { FC } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { isExternalHref } from '../../utils/url'
import styles from './AppCard.module.css'

export interface AppCardProps {
  title: string
  description: string
  href: string
  image: ImageProps
  tag?: string
}

const AppCard: FC<AppCardProps> = ({ title, description, href, image, tag }) => {
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

      {/* Sibling of imageWrapper, not nested in it — imageWrapper is
          aria-hidden (the image is decorative/redundant with the
          title), but this tag's text (e.g. tech stack) is meaningful
          and must stay in the accessible tree. */}
      {tag && <Tag className={styles.tagOverlay}>{tag}</Tag>}

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
