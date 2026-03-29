import Link from '@components/Link'

export default function Navigation() {
  return (
    <nav className="space-x-4">
      <Link to="/">Home</Link>
      <Link to="/apps">Apps</Link>
    </nav>
  )
}
