import Button from '@components/Button'
import { useState, useEffect, FC } from 'react'

export interface FullPageHeaderProps {
  name: string
  tagline: string
  description: string
  imageSrc: string
}

const FullPageHeader: FC<FullPageHeaderProps> = ({ name, tagline, description, imageSrc }) => {
  const [isLoaded, setIsLoaded] = useState(false)

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
          <h1
            className={`text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 dark:text-white transform opacity-0 translate-y-8 transition-all duration-700 ease-in-out ${
              isLoaded ? 'opacity-100 translate-y-0' : ''
            }`}
            style={{ transitionDelay: '50ms' }}
          >
            {name}
          </h1>

          <h2
            className={`text-xl md:text-2xl text-gray-600 dark:text-gray-300 font-medium transform opacity-0 translate-y-8 transition-all duration-700 ease-in-out ${
              isLoaded ? 'opacity-100 translate-y-0' : ''
            }`}
            style={{ transitionDelay: '150ms' }}
          >
            {tagline}
          </h2>

          <p
            className={`text-lg text-gray-600 dark:text-gray-400 max-w-lg transform opacity-0 translate-y-8 transition-all duration-700 ease-in-out ${
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
            className={`relative w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg aspect-[3/4] overflow-hidden rounded-2xl border-4 border-white shadow-xl dark:border-gray-700 transition-all duration-1000 ease-out ${
              isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
            style={{ transitionDelay: '100ms' }}
          >
            <img
              src={imageSrc}
              alt={`Portrait of ${name}`}
              className="w-full h-full object-cover object-[50%_20%]"
              loading="eager"
            />
          </div>
        </div>
      </div>
    </header>
  )
}

export default FullPageHeader
