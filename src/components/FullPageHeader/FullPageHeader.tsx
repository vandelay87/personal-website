import Button from '@components/Button'
import Image from '@components/Image'
import { usePreloadImage } from '@hooks/usePreloadImage'
import { useState, useEffect, FC } from 'react'

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
  const [isLoaded, setIsLoaded] = useState(false)

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

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true)
    }, 300)

    return () => clearTimeout(timer)
  }, [])

  return (
    <header
      className="relative z-0 min-h-screen w-full flex flex-col md:flex-row items-center justify-center p-4 md:p-8 bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-gray-900 dark:to-gray-800"
      style={{
        marginLeft: 'calc(-50vw + 50%)',
        marginRight: 'calc(-50vw + 50%)',
        width: '100vw',
      }}
    >
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
        {/* Text Content */}
        <div className="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left space-y-4 pb-10 sm:pb-16 md:pb-0 order-2 md:order-1">
          <hgroup className="space-y-4">
            <h1
              className={`text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 dark:text-white transform opacity-0 translate-y-8 transition-all duration-700 ease-in-out ${
                isLoaded ? 'opacity-100 translate-y-0' : ''
              }`}
              style={{ transitionDelay: '50ms' }}
            >
              {name}
            </h1>

            <p
              className={`text-xl md:text-2xl text-gray-600 dark:text-gray-300 font-medium transform opacity-0 translate-y-8 transition-all duration-700 ease-in-out ${
                isLoaded ? 'opacity-100 translate-y-0' : ''
              }`}
              style={{ transitionDelay: '150ms' }}
            >
              {tagline}
            </p>
          </hgroup>

          <p
            className={`text-lg leading-relaxed max-w-lg transform opacity-0 translate-y-8 transition-all duration-700 ease-in-out ${
              isLoaded ? 'opacity-100 translate-y-0' : ''
            }`}
            style={{ transitionDelay: '200ms' }}
          >
            {description}
          </p>

          <div
            className={`transform opacity-0 translate-y-8 transition-all duration-700 ease-in-out ${
              isLoaded ? 'opacity-100 translate-y-0' : ''
            }`}
            style={{ transitionDelay: '350ms' }}
          >
            <Button onClick={handleSendEmail}>Get in touch</Button>
          </div>
        </div>

        {/* Image */}
        <div className="w-full md:w-1/2 flex justify-center order-1 md:order-2">
          <div
            className={`relative w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg aspect-[3/4] overflow-hidden rounded-2xl transition-all duration-1000 ease-out ${
              isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
            style={{ transitionDelay: '100ms' }}
          >
            <Image
              src={imageSrc}
              alt={`Portrait of ${name}`}
              priority={true}
              aspectRatio="3/4"
              objectFit="cover"
              objectPosition="50% 20%"
              placeholder="blur"
              containerClassName="rounded-2xl border-4 border-white shadow-xl dark:border-gray-700"
              className="rounded-2xl"
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
