import MyComponent from '../../components/MyComponent'
import AboutMdx from './about.mdx'

export default function About() {
  return (
    <div className="prose mx-auto p-6">
      <AboutMdx components={{ MyComponent }} />
    </div>
  )
}
