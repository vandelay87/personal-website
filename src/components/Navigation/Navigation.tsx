import { Link } from 'react-router-dom'

export default function Navigation() {
  return (
    <nav className="space-x-4">
      <Link to="/" className="text-blue-500">
        Home
      </Link>
      <Link to="/about" className="text-blue-500">
        About
      </Link>
    </nav>
  )
}
