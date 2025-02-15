import MyComponent from '../components/MyComponent'
import AboutContent from './about.mdx'

export default function About() {
  return (
    <div className="prose mx-auto p-6">
      <AboutContent components={{ MyComponent }} />
    </div>
  )
}
