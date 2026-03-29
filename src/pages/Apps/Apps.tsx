import Card from '@components/Card'
import type { CardProps } from '@components/Card'
import Grid from '@components/Grid'
import type { FC } from 'react'
import imgSrc from '../../assets/sand-box.webp'
import imgSrcSet from '../../assets/sand-box.webp?w=320;640;768;1024;1280;1536;1920&format=webp&as=srcset'

const CARDS: CardProps[] = [
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
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4">
        Apps
      </h1>
      <Grid columns={3}>
        {CARDS.map((card) => (
          <Card {...card} key={card.href} />
        ))}
      </Grid>
    </>
  )
}

export default Apps
