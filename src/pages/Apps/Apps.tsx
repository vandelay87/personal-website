import Card from '@components/Card'
import type { CardProps } from '@components/Card'
import Grid from '@components/Grid'
import SocialCard from '@components/SocialCard'
import Typography from '@components/Typography'
import type { FC } from 'react'
import pokedexImgSrc from '../../assets/pokedex.webp'
import pokedexImgSrcSet from '../../assets/pokedex.webp?w=320;640;768;1024;1280;1536;1920&format=webp&as=srcset'
import imgSrc from '../../assets/sand-box.webp'
import imgSrcSet from '../../assets/sand-box.webp?w=320;640;768;1024;1280;1536;1920&format=webp&as=srcset'
import styles from './Apps.module.css'

const CARDS: CardProps[] = [
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
  },
]

const Apps: FC = () => {
  return (
    <>
      <Typography variant="heading1" className={styles.heading}>
        Apps
      </Typography>
      <Typography variant="bodyLarge" className={styles.description}>
        A collection of interactive experiments and side projects. Most of these started as a way to learn something new or answer a question I had about how things work.
      </Typography>
      <Grid columns={3}>
        {CARDS.map((card) => (
          <Card {...card} key={card.href} />
        ))}
      </Grid>
      <div className={styles.social}>
        <SocialCard />
      </div>
    </>
  )
}

export default Apps
