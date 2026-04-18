import Loading from '@components/Loading'
import { useAuth } from '@contexts/AuthContext'
import type { FC, ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

export interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: string
}

const ProtectedRoute: FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth()
  const location = useLocation()

  if (loading && !isAuthenticated) {
    return <Loading />
  }

  if (!isAuthenticated) {
    return <Navigate to={`/admin/login?redirect=${location.pathname}`} replace />
  }

  if (requiredRole === 'admin' && !isAdmin) {
    return <Navigate to="/admin/recipes" replace state={{ accessDenied: true }} />
  }

  return <>{children}</>
}

export default ProtectedRoute
