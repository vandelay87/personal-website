import Card from '@components/Card'
import type { CardProps } from '@components/Card'
import Grid from '@components/Grid'
import type { FC } from 'react'
import img from '../../assets/sand-box.webp'

const CARDS: CardProps[] = [
  {
    title: 'Sand box',
    description:
      'Real-time particle physics simulation of falling sand grains on a black canvas.',
    image: {
      src: img,
      alt: 'Real-time particle physics simulation of falling sand grains on a black canvas',
    },
    href: 'https://akli.dev/sand-box',
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
