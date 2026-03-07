import { FC, ReactNode } from 'react'
import { Link as RouterLink } from 'react-router-dom'

interface LinkProps {
  children: ReactNode
  to: string
}

const Link: FC<LinkProps> = ({ children, to }) =>
  <RouterLink to={to} className="text-blue-500 dark:text-blue-300">
    {children}
  </RouterLink>

  export default Link
