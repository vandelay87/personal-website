import Image from '@components/Image'
import type { ImageProps } from '@components/Image/Image'
import Link from '@components/Link'
import type { FC } from 'react'

export interface CardProps {
  title: string
  description: string
  href: string
  image: ImageProps
}

const Card: FC<CardProps> = ({ title, description, href, image }) => {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-gray-700 dark:bg-gray-900">
      <div className="aspect-video w-full overflow-hidden">
        <Image
          {...image}
          className="transition-transform duration-500 group-hover:scale-105"
          aspectRatio="16/9"
          objectFit="cover"
        />
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
          {title}
        </h3>

        <p className="mb-4 line-clamp-2">{description}</p>

        <Link to={href}>{href}</Link>
      </div>
    </article>
  )
}

export default Card
