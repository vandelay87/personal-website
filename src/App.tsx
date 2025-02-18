import ThemeToggle from '@components/ThemeToggle'
import About from '@pages/About'
import Home from '@pages/Home'
import NotFound from '@pages/NotFound'
import { Routes, Route, Link } from 'react-router-dom'

export default function App() {
  return (
    <div className="p-6 bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-300">
      <nav className="mb-4 space-x-4">
        <Link to="/" className="text-blue-500">
          Home
        </Link>
        <Link to="/about" className="text-blue-500">
          About
        </Link>
      </nav>

      <ThemeToggle />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  )
}
