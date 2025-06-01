import Navigation from '@components/Navigation'
import ThemeToggle from '@components/ThemeToggle'

export default function Header() {
  return (
    <header className="fixed top-0 left-0 w-full z-10 flex items-center justify-between bg-white/80  text-gray-700 dark:bg-gray-800/80 dark:text-gray-300 backdrop-blur-md px-6 py-4">
      <Navigation />
      <ThemeToggle />
    </header>
  )
}
