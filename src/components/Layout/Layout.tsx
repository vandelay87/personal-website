import { ReactNode } from 'react'

type LayoutProps = {
  children: ReactNode
  isHomePage?: boolean
}

export default function Layout({ children, isHomePage = false }: LayoutProps) {
  return (
    <main
      className={`p-6 pb-0 ${!isHomePage && 'pt-20 pb-6'} bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-300`}
    >
      {children}
    </main>
  )
}
