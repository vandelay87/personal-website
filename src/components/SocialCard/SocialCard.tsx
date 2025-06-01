import { FC, JSX } from 'react'

type SocialCardProps = {
  name: string
  url: string
  icon: JSX.Element
}

const SOCIAL_CARD_PROPS: SocialCardProps[] = [
  {
    name: 'GitHub',
    url: 'https://github.com/vandelay87',
    icon: (
      <svg
        className="w-6 h-6"
        fill="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.2.8-.6v-2c-3.2.7-3.8-1.4-3.8-1.4-.5-1.2-1.2-1.5-1.2-1.5-1-.7.1-.7.1-.7 1.1.1 1.6 1.2 1.6 1.2 1 .1.8 1.3.8 1.3.9 1.6 2.3 1.1 2.9.8.1-.6.3-1.1.6-1.4-2.5-.3-5.1-1.3-5.1-5.8 0-1.3.5-2.4 1.2-3.2-.1-.3-.6-1.4.1-2.8 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.2-1.5 3.3-1.2 3.3-1.2.7 1.4.2 2.5.1 2.8.7.8 1.2 1.9 1.2 3.2 0 4.5-2.6 5.5-5.1 5.8.3.3.6.9.6 1.9v2.8c0 .4.2.7.8.6A11.5 11.5 0 0 0 23.5 12C23.5 5.7 18.3.5 12 .5z" />
      </svg>
    ),
  },
  {
    name: 'LinkedIn',
    url: 'https://www.linkedin.com/in/akli-aissat-b08119115/',
    icon: (
      <svg
        className="w-6 h-6"
        fill="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM2 9h6v12H2zM10 9h5.6v1.8h.1c.8-1.4 2.8-2 4.3-2 4.6 0 5.5 3 5.5 6.8V21h-6v-5.2c0-1.2 0-2.7-1.6-2.7s-1.8 1.3-1.8 2.6V21h-6z" />
      </svg>
    ),
  },
  {
    name: 'Email',
    url: 'mailto:akliaissat@outlook.com?subject=Hello',
    icon: (
      <svg
        className="w-6 h-6"
        fill="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4a2 2 0 0 1-2-2V6c0-1.1.9-2 2-2zm0 2v.5l8 5 8-5V6H4zm16 2.7l-7.5 4.7a1 1 0 0 1-1 0L4 8.7V18h16V8.7z" />
      </svg>
    ),
  },
]

const SocialCard: FC = () => {
  return (
    <article
      aria-labelledby="social-heading"
      className="bg-white dark:bg-gray-900 rounded-2xl shadow-md m-8 inset-shadow-2xs p-6 max-w-sm mx-auto"
    >
      <h2 id="social-heading" className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Connect with me
      </h2>
      <ul className="flex space-x-6" role="list">
        {SOCIAL_CARD_PROPS.map(({ name, url, icon }) => (
          <li key={name} role="listitem">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              title={name}
              aria-label={name}
              className="text-gray-600 dark:text-gray-300 hover:text-blue-500 outline-offset-4 transition-colors"
            >
              <span className="sr-only">{name}</span>
              {icon}
            </a>
          </li>
        ))}
      </ul>
    </article>
  )
}

export default SocialCard
