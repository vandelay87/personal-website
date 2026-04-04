import Button from '@components/Button'
import Image from '@components/Image'
import Typography from '@components/Typography'
import { usePreloadImage } from '@hooks/usePreloadImage'
import { FC } from 'react'
import styles from './FullPageHeader.module.css'

export interface FullPageHeaderProps {
  name: string
  tagline: string
  description: string
  imageSrc: string
}

const FullPageHeader: FC<FullPageHeaderProps> = ({
  name,
  tagline,
  description,
  imageSrc,
}) => {
  const imageSizes =
    '(max-width: 640px) 320px, (max-width: 768px) 384px, (max-width: 1024px) 448px, 512px'
  const imageSrcSet = [320, 640, 768, 1024, 1280, 1536, 1920]
    .map((w) => `${imageSrc}?w=${w}&q=75 ${w}w`)
    .join(', ')

  usePreloadImage(imageSrc, {
    fetchPriority: 'high',
    crossOrigin: 'anonymous',
    sizes: imageSizes,
    srcSet: imageSrcSet,
  })

  const handleSendEmail = () =>
    (window.location.href = 'mailto:akliaissat@outlook.com?subject=Hello')

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* Text Content */}
        <div className={styles.textColumn}>
          <hgroup className={styles.hgroup}>
            <Typography variant="heading1" className={styles.heading}>{name}</Typography>
            <Typography variant="bodyLarge" className={styles.tagline}>{tagline}</Typography>
          </hgroup>

          <Typography variant="bodyLarge" className={styles.description}>{description}</Typography>

          <div className={styles.cta}>
            <Button onClick={handleSendEmail}>Get in touch</Button>
          </div>
        </div>

        {/* Image */}
        <div className={styles.imageColumn}>
          <div className={styles.imageWrapper}>
            <Image
              src={imageSrc}
              alt={`Portrait of ${name}`}
              priority={true}
              aspectRatio="3/4"
              objectFit="cover"
              objectPosition="50% 20%"
              placeholder="blur"
              containerClassName={styles.imageContainer}
              className={styles.imageRounded}
              sizes={imageSizes}
              lazy={false}
            />
          </div>
        </div>
      </div>
    </header>
  )
}

export default FullPageHeader
