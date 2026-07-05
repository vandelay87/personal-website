import AppCard from '@components/AppCard'
import type { AppCardProps } from '@components/AppCard'
import Link from '@components/Link'
import Typography from '@components/Typography'
import type { FC } from 'react'
import pokedexImgSrc from '../../assets/pokedex.webp'
import pokedexImgSrcSet from '../../assets/pokedex.webp?w=320;640;768;1024;1280;1536;1920&format=webp&as=srcset'
import imgSrc from '../../assets/sand-box.webp'
import imgSrcSet from '../../assets/sand-box.webp?w=320;640;768;1024;1280;1536;1920&format=webp&as=srcset'
import { pluralize } from '../../utils/pluralize'
import styles from './Apps.module.css'

const APPS: AppCardProps[] = [
  {
    title: 'Pokedex',
    description:
      'A searchable encyclopedia of Gen 1 Pokemon, styled after the classic Game Boy Color Pokedex.',
    image: {
      src: pokedexImgSrc,
      srcSet: pokedexImgSrcSet,
      alt: 'A searchable encyclopedia of Gen 1 Pokemon, styled after the classic Game Boy Color Pokedex',
    },
    href: 'https://akli.dev/apps/pokedex',
    tag: 'React · AWS',
  },
  {
    title: 'Sand box',
    description:
      'Real-time particle physics simulation of falling sand grains on a black canvas.',
    image: {
      src: imgSrc,
      srcSet: imgSrcSet,
      alt: 'Real-time particle physics simulation of falling sand grains on a black canvas',
    },
    href: 'https://akli.dev/apps/sand-box',
    tag: 'Canvas · Physics',
  },
]

const APPS_COUNT_LABEL = pluralize(APPS.length, 'app')

const Apps: FC = () => {
  return (
    <>
      <section className={styles.hero}>
        <Typography variant="caption" as="p" className={styles.eyebrow}>
          Apps &amp; experiments
        </Typography>
        <Typography variant="heading1" className={styles.heading}>
          Apps
        </Typography>
        <Typography variant="bodyLarge" className={styles.lead}>
          A collection of interactive experiments and side projects. Most of
          these started as a way to learn something new or answer a question
          I had about how things work.
        </Typography>
      </section>

      <section className={styles.gridSection} aria-label="App grid">
        <div className={styles.countRow}>
          <span>{APPS_COUNT_LABEL}</span>
        </div>
        <ul className={styles.grid}>
          {APPS.map((app) => (
            <li key={app.href}>
              <AppCard {...app} />
            </li>
          ))}
        </ul>

        <aside className={styles.inProgress} aria-labelledby="in-progress-heading">
          <Typography variant="caption" as="p" id="in-progress-heading" className={styles.eyebrow}>
            In progress
          </Typography>
          <Typography variant="body" className={styles.inProgressText}>
            More experiments are in the works. If you want to follow along, I
            usually write up the interesting ones on the blog.
          </Typography>
          <Link
            to="/blog"
            icon="→"
            nudge="right"
            tone="accent"
            className={styles.readBlogLink}
          >
            Read the blog
          </Link>
        </aside>
      </section>
    </>
  )
}

export default Apps
