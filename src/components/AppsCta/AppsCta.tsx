import Link from '@components/Link'
import { FC } from 'react'

const AppsCta: FC = () => {
  return (
    <section
      className="py-16 px-4 w-screen bg-linear-to-br from-indigo-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 ml-[calc(50%-50vw)]"
      aria-labelledby="apps-section-title"
    >
      <div className="max-w-2xl mx-auto text-center">
        <h2 id="apps-section-title" className="text-3xl font-bold mb-4">
          Apps & experiments
        </h2>

        <p className="text-lg mb-8 leading-relaxed">
          A collection of technical demonstrations and tools, ranging from
          physics-based simulations to functional utilities. Explore the{' '}
          <Link to="/apps" underline={true}>
            Apps library
          </Link>
          .
        </p>
      </div>
    </section>
  )
}

export default AppsCta
