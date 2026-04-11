import type { FC, ReactNode } from 'react'

export interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: string
}

const ProtectedRoute: FC<ProtectedRouteProps> = ({ children }) => <>{children}</>

export default ProtectedRoute
