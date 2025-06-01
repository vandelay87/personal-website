import SocialCard from '@components/SocialCard'

export default function About() {
  return (
    <section>
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4">
        About
      </h1>
      <p>This website is a work in progress.</p>
      <SocialCard />
    </section>
  )
}
