import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  return (
    <div className="flex items-center gap-3">
      {/* Accessible Label */}
      <span
        id="theme-toggle-label"
        className="text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        Dark Mode
      </span>

      {/* Toggle Switch */}
      <label htmlFor="theme-toggle" className="relative inline-flex items-center cursor-pointer">
        <input
          id="theme-toggle"
          type="checkbox"
          checked={theme === 'dark'}
          onChange={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
          className="sr-only peer"
          aria-labelledby="theme-toggle-label"
          aria-checked={theme === 'dark'}
        />
        {/* Toggle Track */}
        <div className="w-10 h-6 bg-gray-300 peer-checked:bg-blue-600 rounded-full transition-colors duration-300 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500 peer-focus-visible:ring-offset-2">
          {/* Toggle Knob */}
          <div
            className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${
              theme === 'dark' ? 'translate-x-5' : 'translate-x-1'
            }`}
          />
        </div>
      </label>
    </div>
  )
}
